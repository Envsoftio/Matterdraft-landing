export const featureHeadings = {
  workspace: {
    title: 'Choose which case papers go in the bundle',
    description:
      'Group the documents into parts and set their order. Keep research and supporting files in the same matter for reference.',
  },
  pdf: {
    title: 'Edit working copies and keep the originals',
    description:
      'Merge PDFs, extract pages or change their order while keeping the imported files intact.',
  },
  ocr: {
    title: 'Make scanned papers searchable',
    description:
      'Use optical character recognition (OCR) to make text searchable, then check the recognised text against the original scan.',
  },
  tools: {
    title: 'Prepare documents for sharing',
    description:
      'Mark redactions, add review notes and choose which watermarks or page marks appear in the exported PDF.',
  },
  templates: {
    title: 'See a document template example',
    description:
      'Use the fictional matter details to see how a template fills in names, dates and case references.',
  },
  collation: {
    title: 'Update page references when case papers change',
    description:
      'When you rebuild, MatterDraft uses the new document order for page numbers, the linked index and bookmarks. Add two pages below to see where the next document starts.',
  },
  volumes: {
    title: 'Split a large bundle into volumes',
    description:
      'Set a page target for each volume and review where the bundle splits. Try a different target to see how whole documents move between volumes.',
  },
  validation: {
    title: 'Check the bundle before export',
    description:
      'Review flagged dates, categories and numbering, then open the generated PDF to check the pages and links yourself.',
  },
  local: {
    title: 'Your case files stay on your computer',
    description:
      'MatterDraft runs OCR, edits PDFs and builds bundles on your computer without uploading your documents, recognised text or finished bundles to our servers.',
  },
  outputs: {
    title: 'Save the bundle in the formats you need',
    description:
      'Save one combined PDF or separate volumes with their own indexes. Export a spreadsheet index when you need page references in a table.',
  },
} as const
