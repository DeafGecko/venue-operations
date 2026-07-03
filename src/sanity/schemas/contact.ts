import { defineType, defineField } from 'sanity';

// Thin overlay document — stores contact status for any person from any source type.
// sourceType + sourceId form the composite key back to the real record.
export const contact = defineType({
  name: 'contact',
  type: 'document',
  title: 'Contact',
  fields: [
    defineField({ name: 'sourceType', type: 'string', title: 'Source Type',
      options: { list: ['client', 'vendor', 'tenant', 'staff', 'booking'] } }),
    defineField({ name: 'sourceId', type: 'string', title: 'Source ID' }),
    defineField({ name: 'contactStatus', type: 'string', title: 'Contact Status',
      options: { list: ['active', 'inactive', 'on-hold'] },
      initialValue: 'active' }),
    defineField({ name: 'notes', type: 'text', title: 'Notes' }),
    defineField({ name: 'tags', type: 'array', title: 'Labels', of: [{ type: 'string' }] }),
    defineField({ name: 'avatar', type: 'image', title: 'Avatar / Logo', options: { hotspot: true } }),
  ],
  preview: { select: { title: 'sourceId', subtitle: 'contactStatus', media: 'avatar' } },
});
