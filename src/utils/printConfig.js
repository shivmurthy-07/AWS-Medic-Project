/**
 * Shared react-to-print page styles so printed clinical records, prescriptions,
 * appointments, and invoices maintain readable page margins and exact colors.
 */
export const PRINT_PAGE_STYLE = `
	@page {
		size: auto;
		margin: 12mm;
	}
	@media print {
		body {
			color-adjust: exact;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
			background: #ffffff !important;
		}
	}
`;
