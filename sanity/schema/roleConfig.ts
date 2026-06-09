export default {
  name: 'roleConfig',
  title: 'Role Configuration',
  type: 'document',
  fields: [
    {
      name: 'slug',
      title: 'Slug',
      type: 'string',
      description: 'Unique identifier (e.g. manager, finance_clerk)',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'name',
      title: 'Display Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'color',
      title: 'Badge Color',
      type: 'string',
      initialValue: '#64748b',
    },
    {
      name: 'rank',
      title: 'Hierarchy Rank',
      type: 'number',
      description: 'Higher rank can manage lower-rank users and roles',
      initialValue: 0,
    },
    {
      name: 'isSystem',
      title: 'System Role',
      type: 'boolean',
      description: 'Built-in roles cannot be deleted',
      initialValue: false,
    },
    {
      name: 'permissions',
      title: 'Permissions',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
    },
    // Legacy field — migrated to slug
    {
      name: 'role',
      title: 'Legacy Role Key',
      type: 'string',
      hidden: true,
    },
  ],
  preview: {
    select: { title: 'name', slug: 'slug', permissions: 'permissions' },
    prepare({
      title,
      slug,
      permissions,
    }: {
      title: string
      slug: string
      permissions: string[]
    }) {
      return {
        title: title || slug,
        subtitle: `${permissions?.length ?? 0} permissions`,
      }
    },
  },
}
