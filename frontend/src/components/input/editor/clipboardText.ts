import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

/**
 * Plain text for copied editor content. ProseMirror's default just concatenates the
 * text, which drops list structure entirely, so a copied bullet list would paste as
 * unrelated lines. Lists get their markers back, so the text still reads as a list.
 */
export function sliceToPlainText(slice: Slice): string {
	return serializeBlocks(slice.content).join('\n')
}

function serializeBlocks(fragment: Fragment): string[] {
	const lines: string[] = []

	fragment.forEach((node: ProseMirrorNode) => {
		if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
			lines.push(...serializeList(node))
			return
		}

		if (node.isTextblock) {
			lines.push(node.textContent)
			return
		}

		if (node.isBlock && !node.isLeaf) {
			lines.push(...serializeBlocks(node.content))
			return
		}

		if (!node.isBlock) {
			lines.push(node.textContent)
		}
	})

	return lines
}

function serializeList(list: ProseMirrorNode): string[] {
	const lines: string[] = []
	const ordered = list.type.name === 'orderedList'
	let number = Number(list.attrs.start ?? 1)

	list.forEach((item: ProseMirrorNode) => {
		const marker = ordered ? `${number++}. ` : '- '
		const itemLines = serializeBlocks(item.content)

		if (itemLines.length === 0) {
			lines.push(marker.trimEnd())
			return
		}

		// Continuation lines (wrapped content, nested lists) line up under the item text.
		const indent = ' '.repeat(marker.length)
		itemLines.forEach((line, index) => {
			lines.push(index === 0 ? marker + line : indent + line)
		})
	})

	return lines
}
