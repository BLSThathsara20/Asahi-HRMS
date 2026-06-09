export default {
  name: 'roleConfig',
  title: 'Role Configuration',
  type: 'document',
  fields: [
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Super Admin', value: 'super_admin' },
          { title: 'Admin', value: 'admin' },
          { title: 'Manager', value: 'manager' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
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
  ],
  preview: {
    select: { title: 'role', permissions: 'permissions' },
    prepare({ title, permissions }: { title: string; permissions: string[] }) {
      return {
        title: `Role: ${title}`,
        subtitle: `${permissions?.length ?? 0} permissions`,
      }
    },
  },
}
