'use client'

import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import { TIER_COUNTS } from '@/lib/datacenter.layout'
import ServerRackPool from './ServerRackPool'
import DustParticles from './DustParticles'
import DataStreams from './DataStreams'
import FailoverStreams from './FailoverStreams'
import BackupUnits from './BackupUnits'
import PurdueHologram from './PurdueHologram'
import MicroAnimDriver from './MicroAnimDriver'
import HudLabel from './HudLabel'
import CopilotNode from './CopilotNode'
import FocusNodeLayer from './FocusNodeLayer'
import ServerSwitchPool from './ServerSwitchPool'
import SiemDisplayPanel from './SiemDisplayPanel'
import DatacenterFloor from './DatacenterFloor'
import DataRings from './DataRings'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

const { colors } = DATACENTER_TOKENS

/**
 * Compositor de la escena (SPEC §9, §20): ensambla la geometría del
 * datacenter escalada por perfil de calidad (ULTRA → LOW).
 * En LOW se omite lo pesado (flujos, holograma) y las partículas se reducen.
 */
export default function DatacenterScene({ profile }: { profile: QualityProfile }) {
  const counts = TIER_COUNTS[profile] ?? TIER_COUNTS.MEDIUM

  return (
    <>
      <MicroAnimDriver profile={profile} />
      <CopilotNode />
      <FocusNodeLayer />
      <DatacenterFloor profile={profile} />
      <DataRings />
      <ServerRackPool profile={profile} />
      <BackupUnits count={counts.backupUnits} />
      <DustParticles count={counts.particles} />
      {profile !== 'LOW' && (
        <>
          <ServerSwitchPool profile={profile} />
          <SiemDisplayPanel profile={profile} />
          <DataStreams />
          <FailoverStreams />
          <PurdueHologram />
        </>
      )}

      {/* HUD diegético (SPEC §13): visible solo cuando su escena está activa. */}
      {profile !== 'LOW' && (
        <>
          <HudLabel position={[-4.6, 3.6, 0.5]} labelKey="dc.scene.boot.status" scene={0} variant="status" color={colors.secondaryBlue} />
          <HudLabel position={[-4.6, 3.15, 0.5]} labelKey="dc.scene.boot.network" scene={0} variant="status" color={colors.dataCyan} />
          <HudLabel position={[-4.6, 2.7, 0.5]} labelKey="dc.scene.boot.ai" scene={0} variant="status" color={colors.gold} />

          <HudLabel position={[0, 5.4, -1.5]} labelKey="dc.scene.architecture.title" scene={1} variant="scene" color={colors.secondaryBlue} />
          <HudLabel position={[3.4, 3.2, 0.5]} labelKey="dc.scene.data.title" scene={2} variant="scene" color={colors.dataCyan} />
          <HudLabel position={[0, 1.2, -1]} labelKey="dc.scene.resilience.title" scene={3} variant="scene" color={colors.securityAmber} />
          <HudLabel position={[0, 4.8, -4]} labelKey="dc.scene.connection.title" scene={4} variant="scene" color={colors.gold} />
        </>
      )}
    </>
  )
}
