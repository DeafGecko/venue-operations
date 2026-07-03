import { defineType, defineField } from 'sanity';

export const contract = defineType({
  name: 'contract',
  type: 'document',
  title: 'Contract',
  fields: [
    defineField({ name: 'contactId',    type: 'string', title: 'Contact Source ID' }),
    defineField({ name: 'contactName',  type: 'string', title: 'Contact Name' }),
    defineField({ name: 'contactEmail', type: 'string', title: 'Contact Email' }),
    defineField({
      name: 'contractType', type: 'string', title: 'Contract Type',
      options: { list: ['rental', 'vendor', 'lease', 'custom'] },
      initialValue: 'rental',
    }),
    defineField({ name: 'title', type: 'string', title: 'Contract Title' }),
    defineField({
      name: 'status', type: 'string', title: 'Status',
      options: { list: ['draft', 'sent', 'signed', 'expired', 'cancelled'] },
      initialValue: 'draft',
    }),
    defineField({ name: 'notes',     type: 'text',     title: 'Notes' }),
    defineField({ name: 'startDate', type: 'date',     title: 'Start Date' }),
    defineField({ name: 'endDate',   type: 'date',     title: 'End Date / Expiry' }),
    defineField({ name: 'sentAt',    type: 'datetime', title: 'Sent At' }),
    defineField({ name: 'signedAt',  type: 'datetime', title: 'Signed At' }),
    defineField({
      name: 'pdfFile', type: 'file', title: 'Signed PDF',
      options: { accept: '.pdf' },
    }),
    defineField({
      name: 'attachments', type: 'array', title: 'Attachments',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Label' }),
            defineField({ name: 'file',  type: 'file',   title: 'File', options: { accept: '.pdf,.jpg,.jpeg,.png,.gif,.webp' } }),
            defineField({ name: 'fileType', type: 'string', title: 'File Type' }),
            defineField({ name: 'uploadedAt', type: 'datetime', title: 'Uploaded At' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'status' },
  },
});
