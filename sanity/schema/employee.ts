export default {
  name: 'employee',
  title: 'Employee',
  type: 'document',
  fields: [
    {
      name: 'employeeId',
      title: 'Employee ID',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
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
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: { required: () => unknown; email: () => unknown }) =>
        Rule.required().email(),
    },
    {
      name: 'department',
      title: 'Department',
      type: 'reference',
      to: [{ type: 'department' }],
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Role summary, responsibilities, or notes',
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'employmentType',
      title: 'Employment Type',
      type: 'string',
      options: {
        list: [
          { title: 'Full Time', value: 'full_time' },
          { title: 'Part Time', value: 'part_time' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'string',
      description: 'How salary is calculated for this employee',
      options: {
        list: [
          { title: 'Hourly', value: 'hourly' },
          { title: 'Daily', value: 'daily' },
          { title: 'Monthly', value: 'monthly' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'payRate',
      title: 'Pay Rate (£)',
      type: 'number',
      description: 'Rate per hour, day, or month depending on payment method',
      validation: (Rule: { required: () => unknown; min: (n: number) => unknown }) =>
        Rule.required().min(0),
    },
    {
      name: 'hoursPerWeek',
      title: 'Contracted Hours / Week',
      type: 'number',
      description: 'Required for part-time employees (UK standard full-time is 37.5 hrs)',
      validation: (Rule: { min: (n: number) => unknown; max: (n: number) => unknown }) =>
        Rule.min(1).max(60),
    },
    {
      name: 'payHistory',
      title: 'Pay Rate History',
      type: 'array',
      description: 'Audit trail when pay rates or payment methods change',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'payRate', title: 'Pay Rate', type: 'number' },
            { name: 'paymentMethod', title: 'Payment Method', type: 'string' },
            { name: 'employmentType', title: 'Employment Type', type: 'string' },
            { name: 'hoursPerWeek', title: 'Hours / Week', type: 'number' },
            { name: 'effectiveFrom', title: 'Effective From', type: 'date' },
            { name: 'changedAt', title: 'Changed On', type: 'datetime' },
            { name: 'note', title: 'Note', type: 'string' },
          ],
        },
      ],
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'avatarUrl',
      title: 'Avatar URL',
      type: 'url',
    },
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      department: 'department.name',
    },
    prepare({
      firstName,
      lastName,
      department,
    }: {
      firstName: string
      lastName: string
      department: string
    }) {
      return {
        title: `${firstName} ${lastName}`,
        subtitle: department,
      }
    },
  },
}
