export default {
  name: 'systemUser',
  title: 'System User',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: { required: () => unknown; email: () => unknown }) =>
        Rule.required().email(),
    },
    {
      name: 'passwordHash',
      title: 'Password Hash',
      type: 'string',
      description: 'Bcrypt hash — set via the app, not manually',
      readOnly: true,
    },
    {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      description: 'UK mobile used to verify identity on first login',
    },
    {
      name: 'mustSetPassword',
      title: 'Must Set Password',
      type: 'boolean',
      description: 'True until the user completes first-login phone verification and password setup',
      initialValue: false,
    },
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
      title: 'Custom Permissions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Leave empty to use role defaults. Set via the app access level editor.',
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
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
      email: 'email',
    },
    prepare({
      firstName,
      lastName,
      role,
      email,
    }: {
      firstName: string
      lastName: string
      role: string
      email: string
    }) {
      return {
        title: `${firstName} ${lastName}`,
        subtitle: `${role} — ${email}`,
      }
    },
  },
}
