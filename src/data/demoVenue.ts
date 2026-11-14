export type DemoBooking = {
  _id: string;
  accountNumber: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  endTime: string;
  paymentStatus: "paid" | "partial" | "unpaid";
  bookingType: "party" | "corporate" | "community" | "market-booth";
  assignedSpace: string;
  guestCount: number;
  coordinator: string;
  revenue: number;
  readiness: number;
};

export const demoBookings: DemoBooking[] = [
  { _id: "demo-01", accountNumber: "BK-2026-0086", clientName: "Northstar Creative", eventName: "Leadership Summit", eventDate: "2026-08-04T09:00:00", endTime: "4:00 PM", paymentStatus: "paid", bookingType: "corporate", assignedSpace: "Grand Hall", guestCount: 180, coordinator: "Maya Chen", revenue: 12400, readiness: 100 },
  { _id: "demo-02", accountNumber: "BK-2026-0085", clientName: "Jordan & Taylor", eventName: "Wedding Reception", eventDate: "2026-08-08T16:30:00", endTime: "11:00 PM", paymentStatus: "partial", bookingType: "party", assignedSpace: "Garden Room", guestCount: 120, coordinator: "Eli Brooks", revenue: 9800, readiness: 82 },
  { _id: "demo-03", accountNumber: "BK-2026-0084", clientName: "Civic Arts Council", eventName: "Local Makers Night", eventDate: "2026-08-11T18:00:00", endTime: "10:00 PM", paymentStatus: "paid", bookingType: "market-booth", assignedSpace: "Gallery", guestCount: 220, coordinator: "Maya Chen", revenue: 6200, readiness: 96 },
  { _id: "demo-04", accountNumber: "BK-2026-0083", clientName: "Harbor Health Group", eventName: "Clinical Innovation Forum", eventDate: "2026-08-14T08:30:00", endTime: "3:30 PM", paymentStatus: "paid", bookingType: "corporate", assignedSpace: "Grand Hall", guestCount: 240, coordinator: "Noah Patel", revenue: 15800, readiness: 91 },
  { _id: "demo-05", accountNumber: "BK-2026-0082", clientName: "The Ellis Family", eventName: "Anniversary Dinner", eventDate: "2026-08-15T17:30:00", endTime: "10:30 PM", paymentStatus: "unpaid", bookingType: "party", assignedSpace: "Garden Room", guestCount: 72, coordinator: "Eli Brooks", revenue: 5400, readiness: 68 },
  { _id: "demo-06", accountNumber: "BK-2026-0081", clientName: "Brightline Ventures", eventName: "Investor Briefing", eventDate: "2026-08-18T10:00:00", endTime: "1:00 PM", paymentStatus: "partial", bookingType: "corporate", assignedSpace: "Studio B", guestCount: 54, coordinator: "Noah Patel", revenue: 4800, readiness: 87 },
  { _id: "demo-07", accountNumber: "BK-2026-0080", clientName: "West End Association", eventName: "Community Town Hall", eventDate: "2026-08-20T18:30:00", endTime: "9:00 PM", paymentStatus: "paid", bookingType: "community", assignedSpace: "Grand Hall", guestCount: 310, coordinator: "Maya Chen", revenue: 7200, readiness: 94 },
  { _id: "demo-08", accountNumber: "BK-2026-0079", clientName: "Aperture Studio", eventName: "Product Launch", eventDate: "2026-08-25T14:00:00", endTime: "8:00 PM", paymentStatus: "partial", bookingType: "corporate", assignedSpace: "Gallery", guestCount: 145, coordinator: "Noah Patel", revenue: 11200, readiness: 76 },
  { _id: "demo-09", accountNumber: "BK-2026-0078", clientName: "Riverside Market", eventName: "Summer Vendor Market", eventDate: "2026-08-27T11:00:00", endTime: "7:00 PM", paymentStatus: "paid", bookingType: "market-booth", assignedSpace: "Courtyard", guestCount: 480, coordinator: "Eli Brooks", revenue: 8900, readiness: 89 },
  { _id: "demo-10", accountNumber: "BK-2026-0077", clientName: "Lumen Foundation", eventName: "Annual Benefit", eventDate: "2026-08-29T17:00:00", endTime: "11:30 PM", paymentStatus: "unpaid", bookingType: "party", assignedSpace: "Grand Hall", guestCount: 260, coordinator: "Maya Chen", revenue: 18600, readiness: 61 },
  { _id: "demo-11", accountNumber: "BK-2026-0076", clientName: "Atlas Engineering", eventName: "Team Offsite", eventDate: "2026-09-03T09:00:00", endTime: "5:00 PM", paymentStatus: "paid", bookingType: "corporate", assignedSpace: "Studio B", guestCount: 68, coordinator: "Noah Patel", revenue: 7600, readiness: 73 },
  { _id: "demo-12", accountNumber: "BK-2026-0075", clientName: "Morgan & Riley", eventName: "Wedding Reception", eventDate: "2026-09-12T16:00:00", endTime: "11:00 PM", paymentStatus: "partial", bookingType: "party", assignedSpace: "Garden Room", guestCount: 132, coordinator: "Eli Brooks", revenue: 10400, readiness: 58 },
];

export const monthlyRevenue = [
  { month: "Mar", revenue: 18200 },
  { month: "Apr", revenue: 24600 },
  { month: "May", revenue: 31800 },
  { month: "Jun", revenue: 28900 },
  { month: "Jul", revenue: 39750 },
  { month: "Aug", revenue: 41500 },
];

export const revenueSlices = [
  { label: "Weddings", value: 74200 },
  { label: "Corporate", value: 48600 },
  { label: "Celebrations", value: 35950 },
  { label: "Community", value: 26000 },
];
