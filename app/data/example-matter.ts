export const matterName = 'Aster Works v. Banyan Projects'
export const categories = [
  'Core documents',
  'Supporting documents',
  'Evidence',
  'Additional material',
] as const
export const documents = [
  { name: 'Petition', pages: 18, part: 0 },
  { name: 'Affidavit', pages: 24, part: 0 },
  { name: 'Agreement', pages: 39, part: 1 },
  { name: 'Correspondence', pages: 27, part: 1 },
  { name: 'Evidence', pages: 52, part: 2 },
  { name: 'Additional records', pages: 36, part: 3 },
]
export function numberDocuments(files: typeof documents) {
  let next = 1
  return files.map((file) => {
    const start = next
    next += file.pages
    return { ...file, start, end: next - 1 }
  })
}
export const numberedDocuments = numberDocuments(documents)
