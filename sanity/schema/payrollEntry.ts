export default {
  name: 'payrollEntry',
  title: 'Payroll Entry',
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
      name: 'periodStart',
      title: 'Period Start',
      type: 'date',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'periodEnd',
      title: 'Period End',
      type: 'date',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'grossPay',
      title: 'Gross Pay',
      type: 'number',
      validation: (Rule: { required: () => unknown; min: (n: number) => unknown }) =>
        Rule.required().min(0),
    },
    {
      name: 'hoursWorked',
      title: 'Hours Worked',
      type: 'number',
    },
    {
      name: 'daysWorked',
      title: 'Days Worked',
      type: 'number',
    },
    {
      name: 'employmentType',
      title: 'Employment Type',
      type: 'string',
    },
    {
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'string',
    },
    {
      name: 'payRate',
      title: 'Pay Rate',
      type: 'number',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Paid', value: 'paid' },
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'paidAt',
      title: 'Paid At',
      type: 'datetime',
    },
    {
      name: 'paidAmount',
      title: 'Paid Amount',
      type: 'number',
      description: 'Amount actually paid (usually matches gross pay)',
    },
    {
      name: 'paidByName',
      title: 'Recorded By',
      type: 'string',
      description: 'Name of the person who marked this payment',
    },
    {
      name: 'paymentReference',
      title: 'Payment Reference',
      type: 'string',
      description: 'Bank transfer reference or payment note',
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      employee: 'employee.firstName',
      lastName: 'employee.lastName',
      grossPay: 'grossPay',
      status: 'status',
      periodStart: 'periodStart',
    },
    prepare({
      employee,
      lastName,
      grossPay,
      status,
      periodStart,
    }: {
      employee: string
      lastName: string
      grossPay: number
      status: string
      periodStart: string
    }) {
      return {
        title: `${employee} ${lastName}`,
        subtitle: `£${grossPay?.toFixed(2) ?? '0.00'} — ${status} (${periodStart})`,
      }
    },
  },
}
