import { redirect } from 'next/navigation';

// Root → redirect to the Tables tab (default landing for staff)
export default function RootPage() {
  redirect('/tables');
}
