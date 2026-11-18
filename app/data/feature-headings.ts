export const featureHeadings = {
  overview: {
    label: 'The whole matter, in view',
    title: 'A PDF is one file.\nA matter is everything around it.',
    description:
      'Keep source documents, working copies, references and final bundles together for each matter.',
  },
  workspace: {
    label: 'Matter workspace',
    title: 'One matter.\nA clear place for everything.',
    description:
      'Group documents by category and arrange them in the order they should appear in the bundle.',
  },
  pdf: {
    label: 'PDF tools',
    title: 'Work on the pages.\nKeep the matter in view.',
    description: 'Merge and split PDFs, reorder pages, and prepare working copies for the bundle.',
  },
  ocr: {
    label: 'Scans and OCR',
    title: 'Turn scanned pages\ninto usable content.',
    description:
      'Use OCR to make scanned text searchable. Review and correct the recognised text in your working copy.',
  },
  tools: {
    label: 'Document tools',
    title: 'Prepare your working copies.',
    description: 'Add review notes, page numbers, and other details before exporting.',
  },
  templates: {
    label: 'Document templates',
    title: 'The matter supplies the fields.\nThe template gives them form.',
    description: 'Fill in the details a template asks for and preview the formatted document.',
  },
  collation: {
    label: 'Pagination and indexing',
    title: 'Stop chasing page numbers.\nWork from one source of order.',
    description:
      'Arrange the bundle once. Page numbers, index entries and bookmarks follow the document order.',
  },
  volumes: {
    label: 'PDF volumes',
    title: 'A page target.\nA sensible place to split.',
    description:
      'Choose a page target for each volume. The example keeps whole documents together.',
  },
  validation: {
    label: 'Bundle checks',
    title: 'Find what needs\na second look.',
    description: 'Find missing dates, categories and numbering issues before you export.',
  },
  local: {
    label: 'Document privacy',
    title: 'Your case files stay\non your device.',
    description:
      'MatterDraft processes files, runs OCR and creates bundles on your computer. We do not upload your documents, OCR text or finished bundles to our servers.',
  },
  outputs: {
    label: 'Bundle export',
    title: 'Ready for the next step.\nEasy to find your way through.',
    description:
      'Review the index, bookmarks and page numbers before saving the bundle on your device.',
  },
  workflow: {
    label: 'Bundle workflow',
    title: 'From the first file to the final output.',
    description:
      'See how each step fits together, from organising case files to exporting the bundle.',
  },
} as const
