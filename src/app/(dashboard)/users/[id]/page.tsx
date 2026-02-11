'use client'

import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProfileView } from '@/components/profile/profile-view'

export default function UserProfilePage() {
    const params = useParams()
    const userId = params.id as string

    return (
        <DashboardLayout>
            <ProfileView userId={userId} />
        </DashboardLayout>
    )
}
