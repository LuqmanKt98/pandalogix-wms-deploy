export const metadata = {
  title: 'PandaLogix WMS',
  description: 'Warehouse Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
