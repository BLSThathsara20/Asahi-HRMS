export default {
  name: 'attendance',
  title: 'Attendance',
  type: 'document',
  fields: [
    {
      name: 'employee',
      title: 'Employee',
      type: 'reference',
      to: [{ type: 'employee' }],
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'signInTime',
      title: 'Sign In Time',
      type: 'datetime',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'signOutTime',
      title: 'Sign Out Time',
      type: 'datetime',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Signed In', value: 'signed_in' },
          { title: 'Signed Out', value: 'signed_out' },
          { title: 'Forgot Sign Out', value: 'forgot_sign_out' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'date',
      title: 'Date (UK)',
      type: 'string',
      description: 'YYYY-MM-DD format in Europe/London timezone',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
    {
      name: 'signInLocation',
      title: 'Sign In Location',
      type: 'object',
      fields: [
        { name: 'latitude', title: 'Latitude', type: 'number' },
        { name: 'longitude', title: 'Longitude', type: 'number' },
        { name: 'accuracy', title: 'Accuracy (m)', type: 'number' },
        { name: 'capturedAt', title: 'Captured At', type: 'datetime' },
        { name: 'placeName', title: 'Place Name', type: 'string' },
      ],
    },
    {
      name: 'signOutLocation',
      title: 'Sign Out Location',
      type: 'object',
      fields: [
        { name: 'latitude', title: 'Latitude', type: 'number' },
        { name: 'longitude', title: 'Longitude', type: 'number' },
        { name: 'accuracy', title: 'Accuracy (m)', type: 'number' },
        { name: 'capturedAt', title: 'Captured At', type: 'datetime' },
        { name: 'placeName', title: 'Place Name', type: 'string' },
      ],
    },
  ],
  preview: {
    select: {
      firstName: 'employee.firstName',
      lastName: 'employee.lastName',
      status: 'status',
      date: 'date',
    },
    prepare({
      firstName,
      lastName,
      status,
      date,
    }: {
      firstName: string
      lastName: string
      status: string
      date: string
    }) {
      return {
        title: `${firstName} ${lastName}`,
        subtitle: `${date} — ${status}`,
      }
    },
  },
}
