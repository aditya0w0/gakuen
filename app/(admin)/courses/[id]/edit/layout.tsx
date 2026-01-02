// Course editor has its own full-bleed layout - no DashboardShell padding
export default function CourseEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
