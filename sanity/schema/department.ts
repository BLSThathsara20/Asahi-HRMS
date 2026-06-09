export default {
  name: 'department',
  title: 'Department',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'color',
      title: 'Colour',
      type: 'string',
      description: 'Hex colour e.g. #1a6fd4',
      initialValue: '#1a6fd4',
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug.current' },
  },
}
