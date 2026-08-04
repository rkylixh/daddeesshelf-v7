import { redirect } from 'next/navigation';

export default function OldInventoryControlPage() {
  redirect('/admin/inventory');
}