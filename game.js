'use strict';

/* =========================================================================
   MODULE 1: CONSTANTS, PALETTE, SURFACES & 16-SKIN 3D CATALOG
   ========================================================================= */
const PALETTE = {
  VOID: 0x10151D,
  STEEL: 0x263747,
  STEEL_DARK: 0x18232E,
  CYAN: 0x00D9FF,
  WHITE: 0xF2F4F5,
  HAZARD: 0xFF654A,
  GOLD: 0xFFB800,
  VIOLET: 0xBD00FF
};

const TUNNEL = {
  HALF_SIZE: 7.0,
  SURFACE_OFFSET: 6.15,
  SEGMENT_LENGTH: 20.0,
  POOL_SEGMENTS: 18,
  VISIBLE_AHEAD: 300.0,
  DESPAWN_Z: 28.0
};

const SURFACES = {
  FLOOR: {
    id: 'FLOOR',
    label: 'SUELO [0°]',
    normal: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(1, 0, 0),
    basePos: new THREE.Vector2(0, -TUNNEL.SURFACE_OFFSET),
    rollAngle: 0,
    compassArrowRot: 0
  },
  CEILING: {
    id: 'CEILING',
    label: 'TECHO [180°]',
    normal: new THREE.Vector3(0, -1, 0),
    right: new THREE.Vector3(-1, 0, 0),
    basePos: new THREE.Vector2(0, TUNNEL.SURFACE_OFFSET),
    rollAngle: Math.PI,
    compassArrowRot: 180
  },
  LEFT: {
    id: 'LEFT',
    label: 'PARED IZQ [-90°]',
    normal: new THREE.Vector3(1, 0, 0),
    right: new THREE.Vector3(0, 1, 0),
    basePos: new THREE.Vector2(-TUNNEL.SURFACE_OFFSET, 0),
    rollAngle: -Math.PI / 2,
    compassArrowRot: 90
  },
  RIGHT: {
    id: 'RIGHT',
    label: 'PARED DER [+90°]',
    normal: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(0, -1, 0),
    basePos: new THREE.Vector2(TUNNEL.SURFACE_OFFSET, 0),
    rollAngle: Math.PI / 2,
    compassArrowRot: -90
  }
};

const SURFACE_KEYS = ['FLOOR', 'CEILING', 'LEFT', 'RIGHT'];

const RARITY_META = {
  COMMON:       { label: 'COMÚN',        colorHex: '#94A3B8', badgeBg: 'rgba(148,163,184,0.18)' },
  RARE:         { label: 'RARO',         colorHex: '#00D9FF', badgeBg: 'rgba(0,217,255,0.18)' },
  EPIC:         { label: 'ÉPICO',        colorHex: '#C084FC', badgeBg: 'rgba(192,132,252,0.18)' },
  LEGENDARY:    { label: 'LEGENDARIO',   colorHex: '#FF654A', badgeBg: 'rgba(255,101,74,0.20)' },
  MYTHIC:       { label: 'MÍTICO',       colorHex: '#FACC15', badgeBg: 'rgba(250,204,21,0.20)' },
  AD_EXCLUSIVE: { label: 'EXCLUSIVO AD', colorHex: '#38BDF8', badgeBg: 'rgba(56,189,248,0.22)' }
};

const SKINS_CATALOG = [
  {
    id: 'core',
    name: 'CORE',
    subtitle: 'Prototipo Tecnológico Base',
    description: 'Chasis equilibrado de serie con visor panorámico cian, propulsores dorsales gemelos y reactor pectoral estabilizado.',
    rarity: 'COMMON',
    unlockType: 'ENERGY',
    cost: 0,
    primaryColor: 0xF2F4F5,
    secondaryColor: 0x16202A,
    glowColor: 0x00D9FF,
    glowHex: '#00D9FF',
    metalness: 0.55,
    roughness: 0.28,
    polyTag: 'ESTÁNDAR // 24 MESHES'
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    subtitle: 'Infiltración Fantasma',
    description: 'Silueta sigilosa con capucha angular blindada, aletas dorsales de capa táctica y cuchillas inversas en antebrazos.',
    rarity: 'RARE',
    unlockType: 'ENERGY',
    cost: 120,
    primaryColor: 0x161E29,
    secondaryColor: 0x0B0F14,
    glowColor: 0x00F0FF,
    glowHex: '#00F0FF',
    metalness: 0.75,
    roughness: 0.22,
    polyTag: 'SIGILO // 32 MESHES'
  },
  {
    id: 'titan',
    name: 'TITAN',
    subtitle: 'Armadura Pesada de Asedio',
    description: 'Coloso blindado con hombreras octogonales masivas, casco de bóveda industrial, grebas reforzadas y reactor dorsal pesado.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 280,
    primaryColor: 0x3A4E63,
    secondaryColor: 0x1B2632,
    glowColor: 0xFF9E00,
    glowHex: '#FF9E00',
    metalness: 0.82,
    roughness: 0.32,
    polyTag: 'PESADO // 38 MESHES'
  },
  {
    id: 'spectre',
    name: 'SPECTRE',
    subtitle: 'Entidad de Fase Translúcida',
    description: 'Cuerpo espectral semitransparente en desfase cuántico con halo de energía flotante y placas de antebrazo suspendidas.',
    rarity: 'RARE',
    unlockType: 'ENERGY',
    cost: 200,
    primaryColor: 0x7CE8FF,
    secondaryColor: 0x102A3A,
    glowColor: 0x00FFFF,
    glowHex: '#00FFFF',
    metalness: 0.25,
    roughness: 0.10,
    transparent: true,
    opacity: 0.60,
    polyTag: 'FASE // 30 MESHES'
  },
  {
    id: 'volt',
    name: 'VOLT',
    subtitle: 'Dinamo de Alta Tensión',
    description: 'Chasis electromagnético equipado con 4 bobinas Tesla dorsales, antenas de descarga craneales y arcos voltaicos activos.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 340,
    primaryColor: 0x1F2D3D,
    secondaryColor: 0x0F1722,
    glowColor: 0xFFE600,
    glowHex: '#FFE600',
    metalness: 0.70,
    roughness: 0.20,
    polyTag: 'TESLA // 36 MESHES'
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    subtitle: 'Unidad de Control Táctico',
    description: 'Armadura de seguridad de élite con cresta de mando, escudo antidisturbios energético en brazo izquierdo y hombreras asimétricas.',
    rarity: 'RARE',
    unlockType: 'ENERGY',
    cost: 240,
    primaryColor: 0xD8E2EC,
    secondaryColor: 0x243447,
    glowColor: 0x00D9FF,
    glowHex: '#00D9FF',
    metalness: 0.65,
    roughness: 0.25,
    polyTag: 'TÁCTICO // 35 MESHES'
  },
  {
    id: 'glitch',
    name: 'GLITCH',
    subtitle: 'Anomalía Digital Fragmentada',
    description: 'Geometría corrupta formada por vóxeles desplazados y cubos holográficos flotantes que vibran en tiempo real.',
    rarity: 'LEGENDARY',
    unlockType: 'ENERGY',
    cost: 520,
    primaryColor: 0x121824,
    secondaryColor: 0x2B1035,
    glowColor: 0xFF2A85,
    glowHex: '#FF2A85',
    metalness: 0.60,
    roughness: 0.15,
    polyTag: 'VÓXEL // 42 MESHES'
  },
  {
    id: 'nebula',
    name: 'NEBULA',
    subtitle: 'Navegante del Vacío Estelar',
    description: 'Escafandra esférica de cristal oscuro acompañada por dos anillos planetarios que orbitan dinámicamente alrededor del torso.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 400,
    primaryColor: 0x1E1B38,
    secondaryColor: 0x0D0B1A,
    glowColor: 0xA855F7,
    glowHex: '#A855F7',
    metalness: 0.78,
    roughness: 0.14,
    polyTag: 'ORBITAL // 34 MESHES'
  },
  {
    id: 'overdrive',
    name: 'OVERDRIVE',
    subtitle: 'Interceptor Supersónico',
    description: 'Fuselaje aerodinámico de competición con alas delta invertidas en la espalda, casco en punta y postquemadores gemelos en piernas.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 380,
    primaryColor: 0xFF4930,
    secondaryColor: 0x18202B,
    glowColor: 0x00F5D4,
    glowHex: '#00F5D4',
    metalness: 0.72,
    roughness: 0.18,
    polyTag: 'AERO // 36 MESHES'
  },
  {
    id: 'reaper',
    name: 'REAPER',
    subtitle: 'Cosechador Abisal Angular',
    description: 'Diseño intimidante con cuernos craneales angulares, guadañas gemelas de energía desplegadas en la espalda y garras metálicas.',
    rarity: 'LEGENDARY',
    unlockType: 'ENERGY',
    cost: 580,
    primaryColor: 0x141619,
    secondaryColor: 0x08090C,
    glowColor: 0xFF3B30,
    glowHex: '#FF3B30',
    metalness: 0.80,
    roughness: 0.22,
    polyTag: 'GUADAÑA // 40 MESHES'
  },
  {
    id: 'chrome',
    name: 'CHROME',
    subtitle: 'Androide de Mercurio Líquido',
    description: 'Superficie especular de cromo pulido con articulaciones esféricas orgánicas y cabeza de cíclope sin costuras.',
    rarity: 'RARE',
    unlockType: 'ENERGY',
    cost: 260,
    primaryColor: 0xFFFFFF,
    secondaryColor: 0xC8D6E5,
    glowColor: 0x00D9FF,
    glowHex: '#00D9FF',
    metalness: 0.98,
    roughness: 0.04,
    polyTag: 'ESPECULAR // 32 MESHES'
  },
  {
    id: 'void',
    name: 'VOID',
    subtitle: 'Horizonte de Sucesos',
    description: 'Revestimiento negro absoluto que absorbe la luz, delimitado únicamente por aristas luminosas cian y un núcleo octaédrico flotante.',
    rarity: 'LEGENDARY',
    unlockType: 'ENERGY',
    cost: 640,
    primaryColor: 0x040608,
    secondaryColor: 0x020304,
    glowColor: 0x00E5FF,
    glowHex: '#00E5FF',
    metalness: 0.10,
    roughness: 0.95,
    polyTag: 'SINGULARIDAD // 38 MESHES'
  },
  {
    id: 'cyber',
    name: 'CYBER',
    subtitle: 'Biomecatrónica Expuesta',
    description: 'Esqueleto cibernético con columna vertebral luminosa segmentada, pistones hidráulicos visibles y antenas neurales dobles.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 420,
    primaryColor: 0x2B394A,
    secondaryColor: 0x121A24,
    glowColor: 0x00FF66,
    glowHex: '#00FF66',
    metalness: 0.85,
    roughness: 0.20,
    polyTag: 'BIOMECH // 44 MESHES'
  },
  {
    id: 'frost',
    name: 'FROST',
    subtitle: 'Exotraje Criogénico Cero Absoluto',
    description: 'Acorazado glacial coronado por cristales de hielo translúcidos en hombros y espalda con tanque criogénico hexagonal.',
    rarity: 'EPIC',
    unlockType: 'ENERGY',
    cost: 450,
    primaryColor: 0xD6F5FF,
    secondaryColor: 0x264D66,
    glowColor: 0x38E8FF,
    glowHex: '#38E8FF',
    metalness: 0.50,
    roughness: 0.12,
    polyTag: 'CRIO // 40 MESHES'
  },
  {
    id: 'omega',
    name: 'OMEGA',
    subtitle: 'Arconte Supremo del Túnel',
    description: 'Armadura mítica de alto rango con 6 alas de serafín gravitatorias flotantes, corona geométrica y doble halo energético animado.',
    rarity: 'MYTHIC',
    unlockType: 'ENERGY',
    cost: 950,
    primaryColor: 0xF4F6F8,
    secondaryColor: 0x1A2430,
    glowColor: 0xFFB800,
    glowHex: '#FFB800',
    metalness: 0.90,
    roughness: 0.10,
    polyTag: 'SERAFÍN // 48 MESHES'
  },
  {
    id: 'aether_valkyrie',
    name: 'AETHER VALKYRIE',
    subtitle: 'Valquiria Celestial // Edición Publicitaria',
    description: 'Chasis exclusivo de gala con halo solar multi-hoja articulado, propulsores alados de valquiria y drones lanza escolta flotantes.',
    rarity: 'AD_EXCLUSIVE',
    unlockType: 'REWARDED_AD',
    cost: 0,
    primaryColor: 0xF8FAFC,
    secondaryColor: 0x1E293B,
    glowColor: 0x38BDF8,
    glowHex: '#38BDF8',
    metalness: 0.92,
    roughness: 0.08,
    polyTag: 'VALQUIRIA // 52 MESHES'
  }
];

/* =========================================================================
   MODULE 1B: MODULAR REWARDED AD SDK SERVICE (Google AdMob / H5 AdPlacement Ready)
   Strictly never fakes an ad or grants rewards without a verified SDK callback.
   ========================================================================= */
class RewardedAdService {
  constructor() {
    this.externalProvider = null;
  }

  registerProvider(providerObj) {
    if (providerObj && typeof providerObj.showRewardedAd === 'function') {
      this.externalProvider = providerObj;
    }
  }

  isProviderAvailable() {
    if (this.externalProvider) return true;
    if (typeof window.adBreak === 'function') return true;
    if (window.admob && typeof window.admob.rewardVideo?.show === 'function') return true;
    return false;
  }

  getProviderStatusText() {
    if (this.isProviderAvailable()) {
      return {
        ready: true,
        label: 'SDK CONECTADO',
        detail: 'Proveedor de anuncios recompensados listo. Completa el vídeo para desbloquear permanentemente.'
      };
    }
    return {
      ready: false,
      label: 'SDK NO DETECTADO EN ENTORNO LOCAL',
      detail: 'Interfaz modular AdMob / H5 AdPlacement lista. Conecta un proveedor real (window.adBreak o adService.registerProvider) para emitir anuncios y desbloquear esta skin.'
    };
  }

  requestRewardedAd({ placementName = 'unlock_aether_valkyrie', onRewardGranted, onAdDismissed, onProviderUnavailable }) {
    if (this.externalProvider) {
      this.externalProvider.showRewardedAd({
        placementName,
        onReward: () => { if (onRewardGranted) onRewardGranted(); },
        onCancel: () => { if (onAdDismissed) onAdDismissed(); }
      });
      return;
    }

    if (typeof window.adBreak === 'function') {
      let rewardEarned = false;
      window.adBreak({
        type: 'reward',
        name: placementName,
        beforeReward: (showAdFn) => { showAdFn(); },
        adViewed: () => {
          rewardEarned = true;
          if (onRewardGranted) onRewardGranted();
        },
        adDismissed: () => {
          if (!rewardEarned && onAdDismissed) onAdDismissed();
        },
        adBreakDone: (placementInfo) => {
          if (placementInfo && placementInfo.breakStatus !== 'viewed' && !rewardEarned) {
            if (onAdDismissed) onAdDismissed();
          }
        }
      });
      return;
    }

    if (onProviderUnavailable) {
      onProviderUnavailable();
    }
  }
}

/* =========================================================================
   MODULE 1C: PROCEDURAL 3D SKIN MESH BUILDER (16 Unique 3D Geometries)
   ========================================================================= */
class SkinMeshBuilder {
  static disposeRig(rig) {
    if (!rig?.root) return;
    const geometries = new Set(), materials = new Set();
    rig.root.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(mat => materials.add(mat));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  }

  static buildCharacterRig(skinConfig) {
    const rig = {
      root: new THREE.Group(),
      torso: new THREE.Group(),
      head: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftLeg: new THREE.Group(),
      rightLeg: new THREE.Group(),
      animExtras: []
    };

    const matPrimary = new THREE.MeshStandardMaterial({
      color: skinConfig.primaryColor,
      metalness: skinConfig.metalness,
      roughness: skinConfig.roughness,
      transparent: !!skinConfig.transparent,
      opacity: skinConfig.opacity || 1.0
    });
    const matSecondary = new THREE.MeshStandardMaterial({
      color: skinConfig.secondaryColor,
      metalness: Math.min(0.95, skinConfig.metalness + 0.1),
      roughness: Math.max(0.1, skinConfig.roughness),
      transparent: !!skinConfig.transparent,
      opacity: skinConfig.opacity ? Math.min(1, skinConfig.opacity + 0.15) : 1.0
    });
    const matGlow = new THREE.MeshBasicMaterial({
      color: skinConfig.glowColor
    });
    const matAccentGold = new THREE.MeshStandardMaterial({
      color: 0xF5D061,
      metalness: 0.92,
      roughness: 0.12
    });

    rig.materials = { matPrimary, matSecondary, matGlow };

    rig.torso.position.y = 1.05;
    rig.root.add(rig.torso);

    rig.head.position.set(0, 0.58, 0);
    rig.torso.add(rig.head);

    const isHeavy = skinConfig.id === 'titan';
    const shoulderX = isHeavy ? 0.46 : 0.38;
    rig.leftArm.position.set(-shoulderX, 0.34, 0);
    rig.rightArm.position.set(shoulderX, 0.34, 0);
    rig.torso.add(rig.leftArm);
    rig.torso.add(rig.rightArm);

    const hipX = isHeavy ? 0.20 : 0.16;
    rig.leftLeg.position.set(-hipX, -0.38, 0);
    rig.rightLeg.position.set(hipX, -0.38, 0);
    rig.torso.add(rig.leftLeg);
    rig.torso.add(rig.rightLeg);

    SkinMeshBuilder.populateBaseBody(rig, skinConfig, matPrimary, matSecondary, matGlow);
    SkinMeshBuilder.populateSkinSpecificGeometry(rig, skinConfig, matPrimary, matSecondary, matGlow, matAccentGold);

    return rig;
  }

  static populateBaseBody(rig, skin, matPrimary, matSecondary, matGlow) {
    const id = skin.id;

    if (id === 'titan') {
      const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.72, 8), matPrimary);
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 8), matGlow);
      reactor.rotation.x = Math.PI / 2;
      reactor.position.set(0, 0.12, 0.02);
      rig.torso.add(reactor);
    } else if (id === 'chrome' || id === 'nebula') {
      const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.68, 16), matPrimary);
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.04, 8, 20), matGlow);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = -0.18;
      rig.torso.add(belt);
    } else if (id === 'cyber') {
      const coreRibs = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.28), matPrimary);
      coreRibs.position.y = 0.20;
      rig.torso.add(coreRibs);

      for (let i = 0; i < 4; i++) {
        const vert = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.34), matGlow);
        vert.position.set(0, -0.22 + i * 0.14, 0);
        rig.torso.add(vert);
      }
    } else {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.33), matPrimary);
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.36), matGlow);
      spine.position.y = 0.08;
      rig.torso.add(spine);
    }

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.20, 0.27), matSecondary);
    pelvis.position.y = -0.32;
    rig.torso.add(pelvis);

    const armWidth = id === 'titan' ? 0.22 : (id === 'chrome' ? 0.14 : 0.15);
    const legWidth = id === 'titan' ? 0.26 : 0.19;
    const useRoundLimbs = (id === 'chrome' || id === 'nebula' || id === 'spectre');

    SkinMeshBuilder.populateLimb(rig.leftArm, armWidth, 0.58, armWidth, useRoundLimbs, matPrimary, matSecondary, matGlow);
    SkinMeshBuilder.populateLimb(rig.rightArm, armWidth, 0.58, armWidth, useRoundLimbs, matPrimary, matSecondary, matGlow);
    SkinMeshBuilder.populateLimb(rig.leftLeg, legWidth, 0.72, legWidth, useRoundLimbs, matPrimary, matSecondary, matGlow);
    SkinMeshBuilder.populateLimb(rig.rightLeg, legWidth, 0.72, legWidth, useRoundLimbs, matPrimary, matSecondary, matGlow);
  }

  static populateLimb(group, w, h, d, isRound, matPrimary, matSecondary, matGlow) {
    const upperGeo = isRound
      ? new THREE.CylinderGeometry(w * 0.5, w * 0.45, h * 0.52, 12)
      : new THREE.BoxGeometry(w, h * 0.52, d);
    const upper = new THREE.Mesh(upperGeo, matSecondary);
    upper.position.y = -h * 0.25;
    group.add(upper);

    const jointGeo = isRound
      ? new THREE.SphereGeometry(w * 0.56, 10, 10)
      : new THREE.BoxGeometry(w * 1.08, h * 0.12, d * 1.08);
    const joint = new THREE.Mesh(jointGeo, matGlow);
    joint.position.y = -h * 0.5;
    group.add(joint);

    const lowerGeo = isRound
      ? new THREE.CylinderGeometry(w * 0.46, w * 0.38, h * 0.5, 12)
      : new THREE.BoxGeometry(w * 0.92, h * 0.5, d * 0.92);
    const lower = new THREE.Mesh(lowerGeo, matPrimary);
    lower.position.y = -h * 0.75;
    group.add(lower);
  }

  static populateSkinSpecificGeometry(rig, skin, matPrimary, matSecondary, matGlow, matGold) {
    const id = skin.id;

    switch (id) {
      case 'core': {
        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.42), matPrimary);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.32), matGlow);
        visor.position.set(0, 0.03, -0.08);
        rig.head.add(helm, visor);

        [-0.14, 0.14].forEach(x => {
          const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.36, 8), matSecondary);
          thruster.position.set(x, 0.12, 0.22);
          thruster.rotation.x = 0.2;
          const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.08, 8), matGlow);
          nozzle.position.y = -0.2;
          thruster.add(nozzle);
          rig.torso.add(thruster);
        });
        break;
      }

      case 'phantom': {
        const hood = new THREE.Mesh(new THREE.ConeGeometry(0.31, 0.48, 4), matPrimary);
        hood.rotation.y = Math.PI / 4;
        hood.position.y = 0.06;
        const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.06, 0.30), matGlow);
        eyeSlit.position.set(0, -0.02, -0.08);
        rig.head.add(hood, eyeSlit);

        [-0.18, 0.18].forEach(x => {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 0.28), matSecondary);
          fin.position.set(x, -0.05, 0.26);
          fin.rotation.x = 0.28;
          rig.torso.add(fin);
        });

        [rig.leftArm, rig.rightArm].forEach((arm, idx) => {
          const sign = idx === 0 ? -1 : 1;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.12), matGlow);
          blade.position.set(sign * 0.11, -0.38, -0.08);
          arm.add(blade);
        });
        break;
      }

      case 'titan': {
        const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.36, 8), matPrimary);
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.34), matGlow);
        slit.position.set(0, 0.02, -0.08);
        rig.head.add(dome, slit);

        [rig.leftArm, rig.rightArm].forEach((arm, idx) => {
          const sign = idx === 0 ? -1 : 1;
          const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.38), matPrimary);
          pauldron.position.set(sign * 0.08, 0.04, 0);
          const trim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.40), matGlow);
          trim.position.y = 0.08;
          pauldron.add(trim);
          arm.add(pauldron);
        });

        const backPack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.50, 0.28), matSecondary);
        backPack.position.set(0, 0.12, 0.26);
        rig.torso.add(backPack);
        break;
      }

      case 'spectre': {
        const headPrism = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), matPrimary);
        headPrism.scale.set(0.9, 1.35, 0.9);
        rig.head.add(headPrism);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 8, 24), matGlow);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.30;
        rig.head.add(halo);

        rig.animExtras.push({
          mesh: halo,
          update: (t) => {
            halo.position.y = 0.28 + Math.sin(t * 4) * 0.04;
            halo.rotation.z = t * 2;
          }
        });
        break;
      }

      case 'volt': {
        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.38), matPrimary);
        rig.head.add(helm);
        [-0.14, 0.14].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 4), matGlow);
          horn.position.set(x, 0.28, -0.05);
          horn.rotation.z = x > 0 ? -0.35 : 0.35;
          rig.head.add(horn);
        });

        [[-0.22, 0.28], [0.22, 0.28], [-0.22, -0.04], [0.22, -0.04]].forEach(([cx, cy]) => {
          const coil = new THREE.Group();
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8), matSecondary);
          const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), matGlow);
          ring1.rotation.x = Math.PI / 2;
          ring1.position.y = 0.06;
          const ring2 = ring1.clone();
          ring2.position.y = 0.14;
          coil.add(rod, ring1, ring2);
          coil.position.set(cx, cy, 0.22);
          coil.rotation.x = 0.45;
          rig.torso.add(coil);
        });
        break;
      }

      case 'sentinel': {
        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.40), matPrimary);
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.46), matGlow);
        crest.position.set(0, 0.22, 0);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.26), matGlow);
        visor.position.set(0, 0.02, -0.10);
        rig.head.add(helm, crest, visor);

        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.34), matGlow);
        shield.position.set(-0.14, -0.36, -0.04);
        const shieldFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.12), matSecondary);
        shieldFrame.position.set(-0.13, -0.36, -0.04);
        rig.leftArm.add(shield, shieldFrame);
        break;
      }

      case 'glitch': {
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.34), matPrimary);
        h1.position.set(0.03, 0.10, 0);
        const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.34), matGlow);
        h2.position.set(-0.04, -0.06, -0.03);
        rig.head.add(h1, h2);

        const glitchGroup = new THREE.Group();
        rig.torso.add(glitchGroup);
        for (let i = 0; i < 8; i++) {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.11, 0.11),
            i % 2 === 0 ? matGlow : matPrimary
          );
          const angle = (i / 8) * Math.PI * 2;
          cube.position.set(Math.cos(angle) * 0.48, (i - 3.5) * 0.14, Math.sin(angle) * 0.38);
          glitchGroup.add(cube);
        }
        rig.animExtras.push({
          mesh: glitchGroup,
          update: (t) => {
            glitchGroup.rotation.y = t * 2.2;
            glitchGroup.children.forEach((c, idx) => {
              c.position.x = Math.cos(t * 3 + idx) * (0.44 + (idx % 2) * 0.08);
            });
          }
        });
        break;
      }

      case 'nebula': {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), matGlow);
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 20), matPrimary);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = -0.14;
        rig.head.add(dome, collar);

        const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 8, 32), matGlow);
        ringA.rotation.x = 1.1;
        ringA.rotation.y = 0.4;
        ringA.position.y = 0.08;
        rig.torso.add(ringA);

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 8, 32), matPrimary);
        ringB.rotation.x = -1.1;
        ringB.rotation.y = -0.4;
        ringB.position.y = 0.08;
        rig.torso.add(ringB);

        rig.animExtras.push({
          mesh: ringA,
          update: (t) => {
            ringA.rotation.z = t * 1.8;
            ringB.rotation.z = -t * 2.4;
          }
        });
        break;
      }

      case 'overdrive': {
        const aeroHelm = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.56, 6), matPrimary);
        aeroHelm.rotation.x = -Math.PI / 2 + 0.35;
        aeroHelm.position.set(0, 0.05, 0.08);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.10, 0.30), matGlow);
        visor.position.set(0, 0.0, -0.12);
        rig.head.add(aeroHelm, visor);

        [-1, 1].forEach(sign => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.05), matPrimary);
          wing.position.set(sign * 0.38, 0.18, 0.22);
          wing.rotation.z = -sign * 0.35;
          wing.rotation.y = sign * 0.25;
          const tip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.06), matGlow);
          tip.position.y = -0.06;
          wing.add(tip);
          rig.torso.add(wing);
        });
        break;
      }

      case 'reaper': {
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.36), matPrimary);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.28), matGlow);
        visor.position.set(0, 0.02, -0.09);
        rig.head.add(skull, visor);

        [-0.15, 0.15].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.36, 5), matSecondary);
          horn.position.set(x, 0.30, 0.04);
          horn.rotation.x = -0.35;
          rig.head.add(horn);
        });

        [-1, 1].forEach(sign => {
          const scytheArm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.08), matSecondary);
          scytheArm.position.set(sign * 0.26, 0.28, 0.24);
          scytheArm.rotation.z = -sign * 0.55;
          const scytheBlade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 3), matGlow);
          scytheBlade.position.set(sign * 0.18, 0.30, 0);
          scytheBlade.rotation.z = -sign * 1.25;
          scytheArm.add(scytheBlade);
          rig.torso.add(scytheArm);
        });
        break;
      }

      case 'chrome': {
        const sphereHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), matPrimary);
        const cyclops = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.07, 20), matGlow);
        cyclops.position.y = 0.02;
        rig.head.add(sphereHead, cyclops);

        [-0.36, 0.36].forEach(x => {
          const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), matPrimary);
          orb.position.set(x, 0.36, 0);
          rig.torso.add(orb);
        });
        break;
      }

      case 'void': {
        const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.32), matPrimary);
        const edgeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.48, 0.34), new THREE.MeshBasicMaterial({
          color: skin.glowColor,
          wireframe: true
        }));
        rig.head.add(monolith, edgeFrame);

        const voidCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), matGlow);
        voidCore.position.set(0, 0.15, 0.32);
        rig.torso.add(voidCore);

        rig.animExtras.push({
          mesh: voidCore,
          update: (t) => {
            voidCore.rotation.y = t * 3.0;
            voidCore.rotation.x = t * 2.0;
          }
        });
        break;
      }

      case 'cyber': {
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.36), matPrimary);
        const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.28), matGlow);
        eyeBar.position.set(0, 0.04, -0.08);
        rig.head.add(headBox, eyeBar);

        [-0.13, 0.13].forEach(x => {
          const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.08), matGlow);
          antenna.position.set(x, 0.24, 0.06);
          antenna.rotation.x = -0.3;
          rig.head.add(antenna);
        });
        break;
      }

      case 'frost': {
        const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.38, 6), matPrimary);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.30), matGlow);
        visor.position.set(0, 0.02, -0.08);
        rig.head.add(helm, visor);

        [-1, 1].forEach(sign => {
          for (let k = 0; k < 2; k++) {
            const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38 + k * 0.1, 5), matGlow);
            crystal.position.set(sign * (0.28 + k * 0.08), 0.38, 0.12 + k * 0.08);
            crystal.rotation.z = -sign * (0.4 + k * 0.2);
            rig.torso.add(crystal);
          }
        });
        break;
      }

      case 'omega': {
        const helm = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), matPrimary);
        const crown = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 6), matGlow);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 0.20;
        rig.head.add(helm, crown);

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 0.18, 0.26);
        rig.torso.add(wingsGroup);

        for (let i = 0; i < 3; i++) {
          [-1, 1].forEach(sign => {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.58 - i * 0.08, 0.09, 0.04), matGlow);
            blade.position.set(sign * (0.36 + i * 0.04), 0.22 - i * 0.20, 0);
            blade.rotation.z = sign * (0.35 - i * 0.28);
            wingsGroup.add(blade);
          });
        }

        rig.animExtras.push({
          mesh: wingsGroup,
          update: (t) => {
            wingsGroup.position.y = 0.18 + Math.sin(t * 3.5) * 0.05;
            wingsGroup.children.forEach((w, idx) => {
              const sign = idx % 2 === 0 ? -1 : 1;
              w.rotation.y = Math.sin(t * 4 + idx) * 0.18 * sign;
            });
          }
        });
        break;
      }

      case 'aether_valkyrie': {
        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.38), matPrimary);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.30), matGlow);
        visor.position.set(0, 0.02, -0.08);
        rig.head.add(helm, visor);

        [-1, 1].forEach(sign => {
          const earWing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.22), matGold);
          earWing.position.set(sign * 0.20, 0.14, 0.04);
          earWing.rotation.x = 0.45;
          earWing.rotation.z = -sign * 0.22;
          rig.head.add(earWing);
        });

        const solarHalo = new THREE.Group();
        solarHalo.position.set(0, 0.26, 0.30);
        rig.torso.add(solarHalo);

        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.03, 8, 24), matGold);
        solarHalo.add(haloRing);

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const ray = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 4), i % 2 === 0 ? matGlow : matGold);
          ray.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0);
          ray.rotation.z = angle - Math.PI / 2;
          solarHalo.add(ray);
        }

        const droneGroup = new THREE.Group();
        rig.torso.add(droneGroup);
        [-0.62, 0.62].forEach(x => {
          const drone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.48, 6), matGlow);
          drone.rotation.x = -Math.PI / 2;
          drone.position.set(x, 0.36, 0.10);
          droneGroup.add(drone);
        });

        rig.animExtras.push({
          mesh: solarHalo,
          update: (t) => {
            solarHalo.rotation.z = t * 1.4;
            droneGroup.position.y = Math.sin(t * 4.2) * 0.06;
          }
        });
        break;
      }
    }
  }
}

/* =========================================================================
   MODULE 2: DETERMINISTIC SEEDED PRNG (Mulberry32)
   ========================================================================= */
class SeededRNG {
  constructor(seedString = '') {
    this.setSeed(seedString);
  }

  setSeed(seedString = '') {
    const clean = (seedString || '').trim().toUpperCase();
    this.seedLabel = clean || ('AUTO-' + Math.floor(1000 + Math.random() * 9000));
    let h = 1779033703 ^ this.seedLabel.length;
    for (let i = 0; i < this.seedLabel.length; i++) {
      h = Math.imul(h ^ this.seedLabel.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    this.state = (h >>> 0) || 123456789;
  }

  next() {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

/* =========================================================================
   MODULE 3: PROCEDURAL WEB AUDIO SYNTHESIZER
   ========================================================================= */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.isMuted = false;
    this.musicInterval = null;
    this.stepIdx = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, gainVal = 0.12, slideFreq = null) {
    if (this.isMuted || !this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
    }

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playUIClick() {
    this.playTone(720, 'triangle', 0.06, 0.08, 980);
  }

  playShiftSound(surfaceKey) {
    const pitchMap = { FLOOR: 240, CEILING: 380, LEFT: 300, RIGHT: 340 };
    const base = pitchMap[surfaceKey] || 300;
    this.playTone(base, 'sine', 0.16, 0.14, base * 1.65);
  }

  playEnergyPickup(multiplier = 1) {
    const base = 520 + Math.min(8, multiplier) * 55;
    this.playTone(base, 'sine', 0.11, 0.12, base * 1.5);
  }

  playImpactCrash() {
    this.playTone(130, 'sawtooth', 0.42, 0.22, 32);
  }

  startMusic() {
    this.stopMusic();
    if (this.isMuted || !this.musicEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];
    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.musicEnabled || !this.ctx) return;
      const note = bassNotes[this.stepIdx % bassNotes.length];
      this.stepIdx++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    }, 220);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

/* =========================================================================
   MODULE 4: SCORE, MULTIPLIER & PERSISTENCE MANAGER (localStorage)
   ========================================================================= */
class ScoreManager {
  constructor() {
    this.storageKey = 'GRAVITY_SHIFT_SAVE_V2';
    this.resetRun();
    this.loadSaveData();
  }

  resetRun() {
    this.distance = 0;
    this.score = 0;
    this.runEnergy = 0;
    this.multiplier = 1.0;
    this.streakProgress = 0;
    this.reviveUsed = false;
    this.missionCompleted = false;
  }

  loadSaveData() {
    const defaults = {
      bestScore: 0,
      bestDistance: 0,
      totalEnergy: 350,
      unlockedSkins: ['core'],
      equippedSkin: 'core',
      settings: {
        transitionDuration: 0.20,
        cameraMode: 'FULL',
        graphics: 'HIGH',
        music: true,
        sfx: true,
        touchpad: true,
        customSeed: ''
      }
    };

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.saveData = {
          ...defaults,
          ...parsed,
          settings: { ...defaults.settings, ...(parsed.settings || {}) }
        };
        for (const key of ['bestScore', 'bestDistance', 'totalEnergy']) {
          const value = Number(this.saveData[key]);
          this.saveData[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : defaults[key];
        }
        this.saveData.unlockedSkins = Array.isArray(parsed.unlockedSkins) ? [...new Set(parsed.unlockedSkins.filter(id => SKINS_CATALOG.some(s => s.id === id)))] : ['core'];
        if (!this.saveData.unlockedSkins.includes(this.saveData.equippedSkin)) this.saveData.equippedSkin = 'core';
        if (!SKINS_CATALOG.some(s => s.id === this.saveData.equippedSkin)) {
          this.saveData.equippedSkin = 'core';
        }
        if (!this.saveData.unlockedSkins.includes('core')) {
          this.saveData.unlockedSkins.push('core');
        }
      } else {
        this.saveData = defaults;
      }
    } catch (e) {
      this.saveData = defaults;
    }
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.saveData));
    } catch (e) {
      // Ignore storage quota errors in restricted frames
    }
  }

  updateFrame(dt, speed) {
    const dMeters = speed * dt * 0.45;
    this.distance += dMeters;
    if (!this.missionCompleted && this.distance >= 250) {
      this.missionCompleted = true;
      this.runEnergy += 75;
      this.saveData.totalEnergy += 75;
      this.persist();
    }
    this.score += dMeters * 12 * this.multiplier;

    if (this.streakProgress > 0) {
      this.streakProgress = Math.max(0, this.streakProgress - dt * 0.14);
      if (this.streakProgress === 0 && this.multiplier > 1.0) {
        this.multiplier = Math.max(1.0, +(this.multiplier - 0.5).toFixed(1));
        this.streakProgress = this.multiplier > 1.0 ? 0.5 : 0;
      }
    }
  }

  collectOrb() {
    this.runEnergy += 1;
    this.saveData.totalEnergy += 1;
    this.streakProgress += 0.38;
    if (this.streakProgress >= 1.0) {
      this.streakProgress = 0.25;
      this.multiplier = Math.min(5.0, +(this.multiplier + 0.5).toFixed(1));
    }
    this.score += 75 * this.multiplier;
  }

  finalizeRun() {
    const finalScore = Math.floor(this.score);
    const finalDist = Math.floor(this.distance);
    let isNewRecord = false;

    if (finalScore > this.saveData.bestScore) {
      this.saveData.bestScore = finalScore;
      isNewRecord = true;
    }
    if (finalDist > this.saveData.bestDistance) {
      this.saveData.bestDistance = finalDist;
    }
    this.persist();
    return isNewRecord;
  }
}

/* =========================================================================
   MODULE 5: 4-SURFACE FREE GRAVITY & ORIENTATION SYSTEM
   ========================================================================= */
class GravitySystem {
  constructor() {
    this.transitionDuration = 0.20;
    this.maxLateralOffset = 4.3;
    this.setSurfaceImmediate('FLOOR');
  }

  setSurfaceImmediate(surfaceKey) {
    const surf = SURFACES[surfaceKey] || SURFACES.FLOOR;
    this.currentSurface = surf;
    this.targetSurface = surf;
    this.lateralOffset = 0;
    this.targetLateralOffset = 0;

    this.isTransitioning = false;
    this.transitionElapsed = 0;

    this.currentPos2D = surf.basePos.clone();
    this.startPos2D = surf.basePos.clone();
    this.targetPos2D = surf.basePos.clone();

    this.currentQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), surf.rollAngle);
    this.startQuat = this.currentQuat.clone();
    this.targetQuat = this.currentQuat.clone();

    this.currentRollAngle = surf.rollAngle;
  }

  shiftTo(surfaceKey) {
    const nextSurf = SURFACES[surfaceKey];
    if (!nextSurf || nextSurf.id === this.targetSurface.id) {
      return false;
    }

    this.targetSurface = nextSurf;
    this.isTransitioning = true;
    this.transitionElapsed = 0;
    this.targetLateralOffset = 0;
    this.lateralOffset = 0;

    this.startPos2D.copy(this.currentPos2D);
    this.targetPos2D.copy(nextSurf.basePos);

    this.startQuat.copy(this.currentQuat);
    this.targetQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), nextSurf.rollAngle);

    return true;
  }

  nudgeLateral(dirSign) {
    if (this.isTransitioning) return;
    this.targetLateralOffset = THREE.MathUtils.clamp(
      this.targetLateralOffset + dirSign * 2.1,
      -this.maxLateralOffset,
      this.maxLateralOffset
    );
  }

  update(dt) {
    if (this.isTransitioning) {
      this.transitionElapsed += dt;
      const rawT = Math.min(1.0, this.transitionElapsed / Math.max(0.05, this.transitionDuration));
      // Smooth cubic ease-out
      const easeT = 1 - Math.pow(1 - rawT, 3);

      // Interpolate 2D cross-section position with a slight inward arc toward tunnel center (0,0)
      this.currentPos2D.lerpVectors(this.startPos2D, this.targetPos2D, easeT);
      const midArc = Math.sin(rawT * Math.PI) * 0.28;
      this.currentPos2D.multiplyScalar(1.0 - midArc);

      // Slerp 3D Quaternion orientation smoothly
      THREE.Quaternion.slerp(this.startQuat, this.targetQuat, this.currentQuat, easeT);

      // Shortest-angle interpolation for camera roll
      let diff = this.targetSurface.rollAngle - this.currentSurface.rollAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRollAngle = this.currentSurface.rollAngle + diff * easeT;

      if (rawT >= 1.0) {
        this.isTransitioning = false;
        this.currentSurface = this.targetSurface;
        this.currentPos2D.copy(this.targetPos2D);
        this.currentQuat.copy(this.targetQuat);
        this.currentRollAngle = this.targetSurface.rollAngle;
      }
    } else {
      // Smooth lateral movement along the active surface's tangent vector
      this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, this.targetLateralOffset, Math.min(1, dt * 14));
      const surf = this.currentSurface;
      this.currentPos2D.set(
        surf.basePos.x + surf.right.x * this.lateralOffset,
        surf.basePos.y + surf.right.y * this.lateralOffset
      );
      this.currentRollAngle = surf.rollAngle;
    }
  }
}

/* =========================================================================
   MODULE 6: 3D ARTICULATED HUMANOID PLAYER & MULTI-SKIN ANIMATION SYSTEM
   ========================================================================= */
class Player {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.visualGroup = new THREE.Group();
    this.root.add(this.visualGroup);
    this.scene.add(this.root);

    this.runCycleTime = 0;
    this.isDead = false;
    this.shieldTimer = 0;
    this.currentRig = null;

    this.buildSupportSystems();
    this.applySkin('core');
  }

  buildSupportSystems() {
    const shieldGeo = new THREE.OctahedronGeometry(1.25, 1);
    this.shieldMat = new THREE.MeshBasicMaterial({
      color: PALETTE.CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.visualGroup.add(this.shieldMesh);

    this.suitLight = new THREE.PointLight(PALETTE.CYAN, 1.4, 9.5);
    this.suitLight.position.set(0, 1.2, 0.5);
    this.visualGroup.add(this.suitLight);

    this.buildParticleSystem();
  }

  buildParticleSystem() {
    this.maxParticles = 60;
    this.particlesData = [];
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: PALETTE.CYAN,
      size: 0.28,
      transparent: true,
      opacity: 0.85
    });

    this.particleSystem = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particleSystem);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particlesData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0
      });
    }
  }

  emitBurst(count = 20, colorHex = PALETTE.CYAN) {
    this.particleMat.color.setHex(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particlesData[i];
      if (p.life <= 0) {
        p.pos.copy(this.root.position);
        p.vel.set(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.2) * 10
        );
        p.life = 0.35 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  applySkin(skinId) {
    const skin = SKINS_CATALOG.find(s => s.id === skinId) || SKINS_CATALOG[0];

    if (this.currentRig && this.currentRig.root) {
      this.visualGroup.remove(this.currentRig.root);
      SkinMeshBuilder.disposeRig(this.currentRig);
    }

    this.currentRig = SkinMeshBuilder.buildCharacterRig(skin);
    this.visualGroup.add(this.currentRig.root);

    this.torso = this.currentRig.torso;
    this.head = this.currentRig.head;
    this.leftArm = this.currentRig.leftArm;
    this.rightArm = this.currentRig.rightArm;
    this.leftLeg = this.currentRig.leftLeg;
    this.rightLeg = this.currentRig.rightLeg;

    this.suitLight.color.setHex(skin.glowColor);
    this.particleMat.color.setHex(skin.glowColor);
  }

  update(dt, speed, gravitySys, isMenuShowcase = false) {
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldMesh.rotation.y += dt * 4;
      this.shieldMesh.rotation.x += dt * 2;
      this.shieldMat.opacity = 0.35 + Math.sin(this.shieldTimer * 18) * 0.2;
    } else {
      this.shieldMat.opacity = 0;
    }

    this.root.position.x = gravitySys.currentPos2D.x;
    this.root.position.y = gravitySys.currentPos2D.y;
    this.root.position.z = 0;
    this.root.quaternion.copy(gravitySys.currentQuat);

    this.elapsed = (this.elapsed || 0) + dt;
    const nowSec = this.elapsed;
    if (this.currentRig && this.currentRig.animExtras) {
      for (let i = 0; i < this.currentRig.animExtras.length; i++) {
        this.currentRig.animExtras[i].update(nowSec, dt);
      }
    }

    if (this.isDead) {
      this.visualGroup.rotation.x += dt * 7.5;
      this.visualGroup.rotation.y += dt * 5.0;
      this.visualGroup.position.z += dt * 6.0;
    } else if (gravitySys.isTransitioning) {
      this.visualGroup.position.set(0, 0.85, 0);
      this.torso.rotation.x = -0.55;
      this.leftArm.rotation.x = 0.8;
      this.rightArm.rotation.x = -0.8;
      this.leftLeg.rotation.x = -0.7;
      this.rightLeg.rotation.x = 0.5;
    } else {
      this.visualGroup.rotation.set(0, isMenuShowcase ? Math.sin(nowSec) * 0.35 : 0, 0);
      this.visualGroup.position.set(0, 0, 0);

      const cadence = isMenuShowcase ? 9.5 : Math.min(22, 10 + speed * 0.22);
      this.runCycleTime += dt * cadence;

      const swing = Math.sin(this.runCycleTime);
      const bob = Math.abs(Math.cos(this.runCycleTime)) * 0.11;

      this.torso.position.y = 1.05 + bob;
      this.torso.rotation.x = -0.22;
      this.torso.rotation.y = swing * 0.14;

      this.leftArm.rotation.x = swing * 0.95;
      this.rightArm.rotation.x = -swing * 0.95;
      this.leftLeg.rotation.x = -swing * 1.05;
      this.rightLeg.rotation.x = swing * 1.05;
    }

    if (!this.isDead && Math.random() < 0.45) {
      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particlesData[i];
        if (p.life <= 0) {
          p.pos.copy(this.root.position);
          p.vel.set((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 10);
          p.life = 0.25;
          break;
        }
      }
    }

    const attr = this.particleSystem.geometry.attributes.position;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlesData[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.addScaledVector(p.vel, dt);
        attr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      } else {
        attr.setXYZ(i, 0, -999, 0);
      }
    }
    attr.needsUpdate = true;
  }

  reset() {
    this.isDead = false;
    this.shieldTimer = 0;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.rotation.set(0, 0, 0);
  }
}

/* =========================================================================
   MODULE 7: THIRD-PERSON GRAVITY-ADAPTIVE CAMERA CONTROLLER
   ========================================================================= */
class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'FULL';
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.currentUp = new THREE.Vector3(0, 1, 0);
    this.smoothedPos = new THREE.Vector3(0, -3.5, 7.2);
  }

  triggerShake(duration = 0.35, intensity = 0.45) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  update(dt, player, gravitySys, speed, isMenuShowcase = false) {
    const surf = gravitySys.targetSurface;
    const normal = surf.normal;

    if (isMenuShowcase) {
      const t = performance.now() * 0.0005;
      this.camera.position.set(Math.sin(t) * 1.6, -3.2, 6.2);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(0, -3.5, -18);
      return;
    }

    // Position camera behind player and lifted along surface normal so all 4 tunnel walls remain readable
    const desiredX = gravitySys.currentPos2D.x * 0.56 + normal.x * 2.25;
    const desiredY = gravitySys.currentPos2D.y * 0.56 + normal.y * 2.25;
    const desiredZ = 7.4;

    this.smoothedPos.x = THREE.MathUtils.lerp(this.smoothedPos.x, desiredX, Math.min(1, dt * 8.5));
    this.smoothedPos.y = THREE.MathUtils.lerp(this.smoothedPos.y, desiredY, Math.min(1, dt * 8.5));
    this.smoothedPos.z = THREE.MathUtils.lerp(this.smoothedPos.z, desiredZ, Math.min(1, dt * 8.5));

    this.camera.position.copy(this.smoothedPos);

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    const rollScale = this.mode === 'HYBRID' ? 0.65 : 1.0;
    const targetUp = new THREE.Vector3(
      -Math.sin(gravitySys.currentRollAngle * rollScale),
      Math.cos(gravitySys.currentRollAngle * rollScale),
      0
    ).normalize();

    this.currentUp.lerp(targetUp, Math.min(1, dt * 9.0)).normalize();
    this.camera.up.copy(this.currentUp);

    const lookX = gravitySys.currentPos2D.x * 0.25;
    const lookY = gravitySys.currentPos2D.y * 0.25;
    this.camera.lookAt(lookX, lookY, -28);

    // Dynamic speed FOV
    const targetFov = Math.min(82, 64 + (speed - 30) * 0.35);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 4);
    this.camera.updateProjectionMatrix();
  }
}

/* =========================================================================
   MODULE 8: PROCEDURAL TUNNEL WITH ASYMMETRIC ARCHITECTURAL ORIENTATION
   Strictly NO floating text labels. Each of the 4 surfaces has a unique
   architectural identity + reactive lighting on gravity transitions.
   ========================================================================= */
class ProceduralWorld {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;

    this.tunnelSegments = [];
    this.obstacles = [];
    this.collectibles = [];

    this.nextSegmentZ = 20;
    this.nextPatternZ = -48;
    this.patternCounter = 0;

    this.activeSurfaceKey = 'FLOOR';
    this.shiftPulseTimer = 0;

    this.initSharedMaterials();
    this.initTunnelPool();
    this.initSpeedDust();
  }

  initSharedMaterials() {
    this.orbGeometry = new THREE.OctahedronGeometry(0.48, 0);
    this.matFloorDeck = new THREE.MeshStandardMaterial({
      color: 0x1E2D3D,
      metalness: 0.72,
      roughness: 0.35
    });
    this.matCeilingVault = new THREE.MeshStandardMaterial({
      color: 0x0B0F17,
      metalness: 0.50,
      roughness: 0.65
    });
    this.matLeftWallPanel = new THREE.MeshStandardMaterial({
      color: 0x16222F,
      metalness: 0.65,
      roughness: 0.42
    });
    this.matRightWallPanel = new THREE.MeshStandardMaterial({
      color: 0x1A2634,
      metalness: 0.70,
      roughness: 0.38
    });
    this.matBrutalRib = new THREE.MeshStandardMaterial({
      color: PALETTE.STEEL,
      metalness: 0.75,
      roughness: 0.30
    });

    this.surfaceTrimMats = {
      FLOOR: new THREE.MeshStandardMaterial({
        color: PALETTE.CYAN,
        emissive: PALETTE.CYAN,
        emissiveIntensity: 0.95
      }),
      CEILING: new THREE.MeshStandardMaterial({
        color: 0x7090B0,
        emissive: 0x38BDF8,
        emissiveIntensity: 0.25
      }),
      LEFT: new THREE.MeshStandardMaterial({
        color: 0x00A8CC,
        emissive: PALETTE.CYAN,
        emissiveIntensity: 0.30
      }),
      RIGHT: new THREE.MeshStandardMaterial({
        color: 0xD99B26,
        emissive: 0xFFB800,
        emissiveIntensity: 0.30
      })
    };

    this.matHazardSolid = new THREE.MeshStandardMaterial({
      color: PALETTE.HAZARD,
      emissive: PALETTE.HAZARD,
      emissiveIntensity: 0.38,
      metalness: 0.5,
      roughness: 0.3
    });
    this.matLaserBeam = new THREE.MeshBasicMaterial({
      color: PALETTE.HAZARD
    });
    this.matHazardZone = new THREE.MeshBasicMaterial({
      color: PALETTE.HAZARD,
      transparent: true,
      opacity: 0.75
    });
    this.matEnergyOrb = new THREE.MeshStandardMaterial({
      color: PALETTE.CYAN,
      emissive: PALETTE.CYAN,
      emissiveIntensity: 0.75,
      metalness: 0.2,
      roughness: 0.1
    });
  }

  notifySurfaceShift(surfaceKey) {
    this.activeSurfaceKey = surfaceKey;
    this.shiftPulseTimer = 0.45;
  }

  initTunnelPool() {
    const H = TUNNEL.HALF_SIZE;
    const L = TUNNEL.SEGMENT_LENGTH;

    const baseSlabGeo = new THREE.BoxGeometry(13.8, 0.5, L - 0.3);
    const cornerBevelGeo = new THREE.BoxGeometry(1.5, 1.5, L);

    // 1. FLOOR GEOMETRIES
    const floorTrackRailGeo = new THREE.BoxGeometry(0.32, 0.14, L);
    const floorCenterTieGeo = new THREE.BoxGeometry(3.4, 0.10, 1.2);

    // 2. CEILING GEOMETRIES
    const ceilingGirderGeo = new THREE.BoxGeometry(12.6, 0.95, 1.5);
    const ceilingStrutGeo = new THREE.BoxGeometry(0.9, 1.3, 1.3);
    const ceilingConduitGeo = new THREE.BoxGeometry(0.16, 0.14, L);

    // 3. LEFT WALL GEOMETRIES
    const leftVerticalPillarGeo = new THREE.BoxGeometry(0.28, 11.8, 0.75);
    const leftLightStripGeo = new THREE.BoxGeometry(0.14, 11.4, 0.28);

    // 4. RIGHT WALL GEOMETRIES
    const rightDiagBeamGeo = new THREE.BoxGeometry(0.26, 13.5, 0.65);
    const rightHorizBandGeo = new THREE.BoxGeometry(0.16, 0.30, L);

    for (let i = 0; i < TUNNEL.POOL_SEGMENTS; i++) {
      const seg = new THREE.Group();

      // A. SUELO (FLOOR)
      const floorSlab = new THREE.Mesh(baseSlabGeo, this.matFloorDeck);
      floorSlab.position.set(0, -H - 0.25, 0);
      seg.add(floorSlab);

      [-2.3, 2.3].forEach(rx => {
        const rail = new THREE.Mesh(floorTrackRailGeo, this.surfaceTrimMats.FLOOR);
        rail.position.set(rx, -H + 0.04, 0);
        seg.add(rail);
      });

      for (let zOff = -L * 0.35; zOff <= L * 0.35; zOff += L * 0.35) {
        const tie = new THREE.Mesh(floorCenterTieGeo, this.matBrutalRib);
        tie.position.set(0, -H + 0.02, zOff);
        seg.add(tie);
      }

      // B. TECHO (CEILING)
      const ceilingSlab = new THREE.Mesh(baseSlabGeo, this.matCeilingVault);
      ceilingSlab.position.set(0, H + 0.25, 0);
      seg.add(ceilingSlab);

      [-L * 0.25, L * 0.25].forEach(zOff => {
        const girder = new THREE.Mesh(ceilingGirderGeo, this.matBrutalRib);
        girder.position.set(0, H - 0.35, zOff);
        seg.add(girder);

        [-3.8, 3.8].forEach(sx => {
          const strut = new THREE.Mesh(ceilingStrutGeo, this.matCeilingVault);
          strut.position.set(sx, H - 0.45, zOff);
          seg.add(strut);
        });
      });

      [-4.8, 4.8].forEach(cx => {
        const conduit = new THREE.Mesh(ceilingConduitGeo, this.surfaceTrimMats.CEILING);
        conduit.position.set(cx, H - 0.06, 0);
        seg.add(conduit);
      });

      // C. PARED IZQUIERDA (LEFT WALL)
      const leftSlab = new THREE.Mesh(baseSlabGeo, this.matLeftWallPanel);
      leftSlab.rotation.z = Math.PI / 2;
      leftSlab.position.set(-H - 0.25, 0, 0);
      seg.add(leftSlab);

      [-L * 0.33, 0, L * 0.33].forEach(zOff => {
        const pilaster = new THREE.Mesh(leftVerticalPillarGeo, this.matBrutalRib);
        pilaster.position.set(-H + 0.12, 0, zOff);
        seg.add(pilaster);

        const vLight = new THREE.Mesh(leftLightStripGeo, this.surfaceTrimMats.LEFT);
        vLight.position.set(-H + 0.22, 0, zOff);
        seg.add(vLight);
      });

      // D. PARED DERECHA (RIGHT WALL)
      const rightSlab = new THREE.Mesh(baseSlabGeo, this.matRightWallPanel);
      rightSlab.rotation.z = Math.PI / 2;
      rightSlab.position.set(H + 0.25, 0, 0);
      seg.add(rightSlab);

      [-L * 0.24, L * 0.24].forEach((zOff, idx) => {
        const diag = new THREE.Mesh(rightDiagBeamGeo, this.matBrutalRib);
        diag.position.set(H - 0.12, 0, zOff);
        diag.rotation.x = idx === 0 ? 0.52 : -0.52;
        seg.add(diag);
      });

      [-2.2, 2.2].forEach(hy => {
        const hBand = new THREE.Mesh(rightHorizBandGeo, this.surfaceTrimMats.RIGHT);
        hBand.position.set(H - 0.05, hy, 0);
        seg.add(hBand);
      });

      // E. 4 STRUCTURAL CHAMFERED CORNERS
      const corners = [[-H, -H], [H, -H], [-H, H], [H, H]];
      corners.forEach(([cx, cy]) => {
        const corner = new THREE.Mesh(cornerBevelGeo, this.matBrutalRib);
        corner.position.set(cx, cy, 0);
        corner.rotation.z = Math.PI / 4;
        seg.add(corner);
      });

      seg.position.z = this.nextSegmentZ;
      this.nextSegmentZ -= L;
      this.scene.add(seg);
      this.tunnelSegments.push(seg);
    }
  }

  initSpeedDust() {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12.5;
      pos[i * 3 + 2] = -Math.random() * 260;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: PALETTE.CYAN,
      size: 0.18,
      transparent: true,
      opacity: 0.45
    });
    this.speedDust = new THREE.Points(geo, mat);
    this.scene.add(this.speedDust);
  }

  releaseMesh(mesh) {
    const geometries = new Set();
    mesh.traverse(child => { if (child.geometry && child.geometry !== this.orbGeometry) geometries.add(child.geometry); });
    geometries.forEach(geometry => geometry.dispose());
    this.scene.remove(mesh);
  }

  resetWorld() {
    this.elapsed = 0;
    this.obstacles.forEach(o => this.releaseMesh(o.mesh));
    this.collectibles.forEach(c => this.releaseMesh(c.mesh));
    this.obstacles = [];
    this.collectibles = [];

    this.nextPatternZ = -52;
    this.patternCounter = 0;

    for (let i = 0; i < 10; i++) {
      this.spawnNextPattern(0);
    }
  }

  spawnSurfaceObstacle(surfaceKey, zPos, type = 'BARRIER') {
    const surf = SURFACES[surfaceKey];
    const group = new THREE.Group();
    group.position.set(surf.basePos.x, surf.basePos.y, zPos);
    group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), surf.rollAngle);

    let halfW = 5.4;
    let height = 2.4;
    let halfD = 0.9;

    if (type === 'BARRIER') {
      const block = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.3, 1.5), this.matHazardSolid);
      block.position.y = 1.15;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.35, 1.6), this.matBrutalRib);
      stripe.position.y = 2.1;
      group.add(block, stripe);
    } else if (type === 'LASER') {
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.0, 0.6), this.matBrutalRib);
      postL.position.set(-5.2, 1.5, 0);
      const postR = postL.clone();
      postR.position.set(5.2, 1.5, 0);

      const beam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 10.4, 8), this.matLaserBeam);
      beam1.rotation.z = Math.PI / 2;
      beam1.position.y = 1.1;
      const beam2 = beam1.clone();
      beam2.position.y = 2.2;

      group.add(postL, postR, beam1, beam2);
      height = 2.7;
      halfD = 0.6;
    } else if (type === 'HAZARD_ZONE') {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.35, 7.5), this.matHazardZone);
      pad.position.y = 0.18;
      group.add(pad);
      height = 1.1;
      halfD = 3.6;
    } else if (type === 'MOVING') {
      const crusher = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 1.6), this.matHazardSolid);
      crusher.position.y = 1.3;
      group.add(crusher);
      halfW = 2.3;
      height = 2.6;
    }

    this.scene.add(group);
    this.obstacles.push({
      type,
      surfaceKey,
      mesh: group,
      halfW,
      height,
      halfD,
      phase: this.rng.range(0, Math.PI * 2),
      localX: 0
    });
  }

  spawnRotatingBlades(zPos) {
    const group = new THREE.Group();
    group.position.set(0, 0, zPos);

    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(1.3, 0), this.matBrutalRib);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.25, 1.25), this.matHazardSolid);
    group.add(hub, arm);

    this.scene.add(group);
    this.obstacles.push({
      type: 'ROTATING',
      surfaceKey: 'ALL',
      mesh: group,
      rotSpeed: (this.rng.next() > 0.5 ? 1 : -1) * 1.65,
      halfD: 0.9
    });
  }

  spawnEnergyTrail(surfaceKey, startZ, count = 4, spacing = 4.2) {
    const surf = SURFACES[surfaceKey];
    const orbGeo = this.orbGeometry;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(orbGeo, this.matEnergyOrb);
      const pos = new THREE.Vector3(
        surf.basePos.x + surf.normal.x * 1.05,
        surf.basePos.y + surf.normal.y * 1.05,
        startZ - i * spacing
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.collectibles.push({
        mesh,
        surfaceKey,
        collected: false
      });
    }
  }

  /**
   * Solvability-Validated Procedural Pattern Generator:
   * Guarantees at least 1 surface is always 100% open and places guiding energy orbs on a safe surface.
   */
  spawnNextPattern(distance) {
    this.patternCounter++;
    const z = this.nextPatternZ;

    // Progressive spacing based on distance
    const gap = Math.max(24, 34 - Math.min(10, distance * 0.004));
    this.nextPatternZ -= gap;

    // Rotating beam pattern every few steps
    if (this.patternCounter % 5 === 0) {
      this.spawnRotatingBlades(z);
      const safeKey = this.rng.pick(SURFACE_KEYS);
      this.spawnEnergyTrail(safeKey, z - 8, 3, 4.0);
      return;
    }

    // Determine how many surfaces to block (1 to 3, NEVER 4)
    const maxBlocked = distance > 350 ? 3 : (distance > 120 ? 2 : 1);
    const numBlocked = Math.min(3, Math.floor(this.rng.range(1, maxBlocked + 0.95)));

    const shuffled = [...SURFACE_KEYS].sort(() => this.rng.next() - 0.5);
    const blockedSurfaces = shuffled.slice(0, numBlocked);
    const safeSurfaces = shuffled.slice(numBlocked);

    const obsTypes = ['BARRIER', 'LASER', 'HAZARD_ZONE', 'MOVING'];
    blockedSurfaces.forEach(sKey => {
      const chosenType = this.rng.pick(obsTypes);
      this.spawnSurfaceObstacle(sKey, z, chosenType);
    });

    // Always place energy collectibles on one of the verified safe surfaces
    if (safeSurfaces.length > 0) {
      const rewardSurf = safeSurfaces[0];
      this.spawnEnergyTrail(rewardSurf, z + 4, 3, 4.0);
    }
  }

  update(dt, speed, distance) {
    const moveZ = speed * dt;

    // 0. Update Reactive Architectural Surface Lighting
    if (this.shiftPulseTimer > 0) {
      this.shiftPulseTimer = Math.max(0, this.shiftPulseTimer - dt);
    }
    const pulseBoost = this.shiftPulseTimer * 2.2;
    SURFACE_KEYS.forEach(k => {
      const mat = this.surfaceTrimMats[k];
      const isCurrent = (k === this.activeSurfaceKey);
      const targetIntensity = isCurrent ? (0.95 + pulseBoost) : 0.24;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetIntensity, Math.min(1, dt * 10));
    });

    // 1. Recycle Pooled Tunnel Segments
    let furthestZ = 0;
    for (let i = 0; i < this.tunnelSegments.length; i++) {
      if (this.tunnelSegments[i].position.z < furthestZ) {
        furthestZ = this.tunnelSegments[i].position.z;
      }
    }

    for (let i = 0; i < this.tunnelSegments.length; i++) {
      const seg = this.tunnelSegments[i];
      seg.position.z += moveZ;
      if (seg.position.z > TUNNEL.DESPAWN_Z) {
        seg.position.z = furthestZ - TUNNEL.SEGMENT_LENGTH;
        furthestZ = seg.position.z;
      }
    }

    // 2. Update Speed Dust
    const dustAttr = this.speedDust.geometry.attributes.position;
    for (let i = 0; i < dustAttr.count; i++) {
      let z = dustAttr.getZ(i) + moveZ * 1.35;
      if (z > 12) z = -250;
      dustAttr.setZ(i, z);
    }
    dustAttr.needsUpdate = true;

    // 3. Advance & Animate Obstacles
    this.elapsed = (this.elapsed || 0) + dt;
    const nowSec = this.elapsed;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;

      if (obs.type === 'ROTATING') {
        obs.mesh.rotation.z += obs.rotSpeed * dt;
      } else if (obs.type === 'MOVING') {
        const surf = SURFACES[obs.surfaceKey];
        obs.localX = Math.sin(nowSec * 3.0 + obs.phase) * 3.4;
        obs.mesh.position.x = surf.basePos.x + surf.right.x * obs.localX;
        obs.mesh.position.y = surf.basePos.y + surf.right.y * obs.localX;
      }

      if (obs.mesh.position.z > TUNNEL.DESPAWN_Z) {
        this.releaseMesh(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // 4. Advance & Rotate Energy Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.mesh.position.z += moveZ;
      c.mesh.rotation.y += dt * 3.5;
      c.mesh.rotation.x += dt * 2.0;

      if (c.mesh.position.z > TUNNEL.DESPAWN_Z || c.collected) {
        this.releaseMesh(c.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // 5. Advance Pattern Horizon
    this.nextPatternZ += moveZ;
    while (this.nextPatternZ > -TUNNEL.VISIBLE_AHEAD) {
      this.spawnNextPattern(distance);
    }
  }

  checkCollisions(player, gravitySys, onOrbPicked, onObstacleHit) {
    const playerPos = player.root.position;

    // 1. Collectibles Check
    for (let i = 0; i < this.collectibles.length; i++) {
      const c = this.collectibles[i];
      if (!c.collected && Math.abs(c.mesh.position.z) < 1.8) {
        const dx = c.mesh.position.x - playerPos.x;
        const dy = c.mesh.position.y - playerPos.y;
        if (dx * dx + dy * dy < 2.4) {
          c.collected = true;
          onOrbPicked(c.mesh.position);
        }
      }
    }

    // Skip hazard collision if emergency shield is active
    if (player.shieldTimer > 0) return;

    // 2. Obstacles Check
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (Math.abs(obs.mesh.position.z) > obs.halfD + 0.55) continue;

      if (obs.type === 'ROTATING') {
        // Distance from player torso center to rotating bar line segment
        const surf = gravitySys.currentSurface;
        const torsoX = playerPos.x + surf.normal.x * 1.0;
        const torsoY = playerPos.y + surf.normal.y * 1.0;
        const angle = obs.mesh.rotation.z;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const perpDist = Math.abs(-sinA * torsoX + cosA * torsoY);
        if (perpDist < 0.95) {
          onObstacleHit();
          return;
        }
      } else if (obs.surfaceKey === gravitySys.currentSurface.id && !gravitySys.isTransitioning) {
        const latDiff = Math.abs(gravitySys.lateralOffset - (obs.localX || 0));
        if (latDiff < obs.halfW + 0.35) {
          onObstacleHit();
          return;
        }
      }
    }
  }
}

/* =========================================================================
   MODULE 9B: HANGAR 3D PREVIEW TURNTABLE STUDIO (Single On-Demand Instance)
   ========================================================================= */
class HangarPreviewStudio {
  constructor() {
    this.canvas = document.getElementById('hangar-preview-canvas');
    this.viewport = document.getElementById('hangar-preview-viewport');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.pedestalGroup = null;
    this.previewRig = null;
    this.isActive = false;
    this.poseMode = 'RUN';
    this.userYaw = 0.35;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.animTime = 0;

    this.bindInteraction();
  }

  ensureInitialized() {
    if (this.renderer) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
    this.camera.position.set(0, 1.25, 3.55);
    this.camera.lookAt(0, 0.98, 0);

    const amb = new THREE.AmbientLight(0x99BBDD, 0.85);
    this.scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.15);
    keyLight.position.set(3, 5, 4);
    this.scene.add(keyLight);

    this.rimLight = new THREE.PointLight(PALETTE.CYAN, 1.6, 8);
    this.rimLight.position.set(-2, 2.2, -2);
    this.scene.add(this.rimLight);

    this.pedestalGroup = new THREE.Group();
    this.scene.add(this.pedestalGroup);

    const baseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.08, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: PALETTE.STEEL_DARK, metalness: 0.8, roughness: 0.3 })
    );
    baseDisc.position.y = -0.07;
    this.pedestalGroup.add(baseDisc);

    this.pedestalRingMat = new THREE.MeshBasicMaterial({ color: PALETTE.CYAN });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.025, 8, 32), this.pedestalRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.pedestalGroup.add(ring);
  }

  bindInteraction() {
    if (!this.viewport) return;
    const startDrag = (clientX) => {
      this.isDragging = true;
      this.lastMouseX = clientX;
    };
    const moveDrag = (clientX) => {
      if (!this.isDragging) return;
      const dx = clientX - this.lastMouseX;
      this.lastMouseX = clientX;
      this.userYaw += dx * 0.012;
    };
    const endDrag = () => { this.isDragging = false; };

    this.viewport.addEventListener('mousedown', e => startDrag(e.clientX));
    window.addEventListener('mousemove', e => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);

    this.viewport.addEventListener('touchstart', e => {
      if (e.touches.length > 0) startDrag(e.touches[0].clientX);
    }, { passive: true });
    this.viewport.addEventListener('touchmove', e => {
      if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
    }, { passive: true });
    this.viewport.addEventListener('touchend', endDrag, { passive: true });
  }

  loadSkinModel(skinConfig) {
    this.ensureInitialized();
    this.resize();

    if (this.previewRig && this.previewRig.root) {
      this.pedestalGroup.remove(this.previewRig.root);
      SkinMeshBuilder.disposeRig(this.previewRig);
    }

    this.previewRig = SkinMeshBuilder.buildCharacterRig(skinConfig);
    this.pedestalGroup.add(this.previewRig.root);
    this.pedestalRingMat.color.setHex(skinConfig.glowColor);
    this.rimLight.color.setHex(skinConfig.glowColor);
  }

  resize() {
    if (!this.renderer || !this.viewport) return;
    const w = Math.max(200, this.viewport.clientWidth);
    const h = Math.max(180, this.viewport.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  updateAndRender(dt) {
    if (!this.isActive || !this.renderer || !this.previewRig) return;

    this.animTime += dt;
    if (!this.isDragging) {
      this.userYaw += dt * 0.65;
    }
    this.pedestalGroup.rotation.y = this.userYaw;

    if (this.previewRig.animExtras) {
      for (let i = 0; i < this.previewRig.animExtras.length; i++) {
        this.previewRig.animExtras[i].update(this.animTime, dt);
      }
    }

    if (this.poseMode === 'RUN') {
      const t = this.animTime * 7.5;
      const swing = Math.sin(t);
      const bob = Math.abs(Math.cos(t)) * 0.08;
      this.previewRig.torso.position.y = 1.05 + bob;
      this.previewRig.torso.rotation.x = -0.16;
      this.previewRig.torso.rotation.y = swing * 0.12;
      this.previewRig.leftArm.rotation.x = swing * 0.85;
      this.previewRig.rightArm.rotation.x = -swing * 0.85;
      this.previewRig.leftLeg.rotation.x = -swing * 0.95;
      this.previewRig.rightLeg.rotation.x = swing * 0.95;
    } else {
      const breath = Math.sin(this.animTime * 2.5) * 0.03;
      this.previewRig.torso.position.y = 1.05 + breath;
      this.previewRig.torso.rotation.set(0, 0, 0);
      this.previewRig.leftArm.rotation.x = -0.12;
      this.previewRig.rightArm.rotation.x = 0.12;
      this.previewRig.leftLeg.rotation.x = 0;
      this.previewRig.rightLeg.rotation.x = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

/* =========================================================================
   MODULE 10: MAIN GAME ENGINE & UI COORDINATOR
   ========================================================================= */
class GravityShiftGame {
  constructor() {
    this.state = 'MENU';
    this.countdownRemaining = 0;
    this.fixedAccumulator = 0;
    this.scoreMgr = new ScoreManager();
    this.audio = new AudioManager();
    this.adService = new RewardedAdService();
    this.hangarStudio = new HangarPreviewStudio();
    this.rng = new SeededRNG(this.scoreMgr.saveData.settings.customSeed);

    this.selectedShopSkinId = this.scoreMgr.saveData.equippedSkin;
    this.activeShopFilter = 'ALL';

    this.baseSpeed = 30.0;
    this.maxSpeed = 68.0;
    this.currentSpeed = this.baseSpeed;

    this.initThreeScene();
    this.gravitySys = new GravitySystem();
    this.player = new Player(this.scene);
    this.cameraCtrl = new CameraController(this.camera);
    this.world = new ProceduralWorld(this.scene, this.rng);

    this.applySavedSettings();
    this.bindEvents();
    this.refreshAllUI();

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThreeScene() {
    const container = document.getElementById('canvas-container');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.VOID);
    this.scene.fog = new THREE.FogExp2(PALETTE.VOID, 0.0085);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 340);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x88AACC, 0.78);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xF2F4F5, 0.95);
    dirLight.position.set(8, 16, 14);
    this.scene.add(dirLight);

    const coreLight = new THREE.PointLight(PALETTE.CYAN, 1.1, 95);
    coreLight.position.set(0, 0, -35);
    this.scene.add(coreLight);
  }

  applySavedSettings() {
    const s = this.scoreMgr.saveData.settings;
    this.gravitySys.transitionDuration = parseFloat(s.transitionDuration) || 0.20;
    this.cameraCtrl.mode = s.cameraMode || 'FULL';
    this.audio.musicEnabled = !!s.music;
    this.audio.sfxEnabled = !!s.sfx;

    const maxDpr = s.graphics === 'PERFORMANCE' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(maxDpr);

    const touchPad = document.getElementById('touch-controls');
    if (touchPad) {
      touchPad.classList.toggle('hidden', !s.touchpad);
    }

    this.player.applySkin(this.scoreMgr.saveData.equippedSkin);
  }

  bindEvents() {
    document.getElementById('btn-cancel-countdown').onclick = () => this.returnToMainMenu();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'PLAYING') this.pauseGame();
        if (this.state === 'COUNTDOWN') this.returnToMainMenu();
        this.scoreMgr.persist();
      }
      this.lastTime = performance.now();
      this.fixedAccumulator = 0;
    });
    window.addEventListener('blur', () => { if (this.state === 'PLAYING') this.pauseGame(); });
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.hangarStudio.isActive) {
        this.hangarStudio.resize();
      }
    });

    // Keyboard Controls (W/S/A/D + Arrow Keys for 4 Surfaces, Q/E for lateral adjustment, ESC for Pause)
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input,select,textarea') || e.repeat) return;
      const code = e.code;
      if (code === 'Escape') {
        if (this.state === 'COUNTDOWN') { this.returnToMainMenu(); return; }
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
        return;
      }

      if (this.state !== 'PLAYING') return;

      if (code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault();
        this.triggerSurfaceShift('CEILING');
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault();
        this.triggerSurfaceShift('FLOOR');
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        e.preventDefault();
        this.triggerSurfaceShift('LEFT');
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        e.preventDefault();
        this.triggerSurfaceShift('RIGHT');
      } else if (code === 'KeyQ') {
        this.gravitySys.nudgeLateral(-1);
      } else if (code === 'KeyE') {
        this.gravitySys.nudgeLateral(1);
      }
    });

    // Touch Swipe Gesture Controls on Gameplay Viewport
    let touchStartX = 0;
    let touchStartY = 0;
    const canvasEl = this.renderer.domElement;

    canvasEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvasEl.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING' || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) this.triggerSurfaceShift('CEILING');
        else this.triggerSurfaceShift('FLOOR');
      } else {
        if (dx < 0) this.triggerSurfaceShift('LEFT');
        else this.triggerSurfaceShift('RIGHT');
      }
    }, { passive: true });

    // On-Screen 4G Directional Pad Buttons
    document.querySelectorAll('.surface-pad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const surfKey = btn.getAttribute('data-surface');
        if (this.state === 'PLAYING' && surfKey) {
          this.triggerSurfaceShift(surfKey);
        }
      });
    });

    // Main Menu & Gameplay Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.audio.playUIClick();
      this.startNewRun();
    });

    document.getElementById('btn-pause-game').addEventListener('click', () => {
      this.audio.playUIClick();
      this.pauseGame();
    });

    document.getElementById('btn-resume-game').addEventListener('click', () => {
      this.audio.playUIClick();
      this.resumeGame();
    });

    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      this.audio.playUIClick();
      this.startNewRun();
    });

    document.getElementById('btn-quit-pause').addEventListener('click', () => {
      this.audio.playUIClick();
      this.returnToMainMenu();
    });

    document.getElementById('btn-retry-game').addEventListener('click', () => {
      this.audio.playUIClick();
      this.startNewRun();
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      this.audio.playUIClick();
      this.returnToMainMenu();
    });

    // Emergency Shield Revive
    document.getElementById('btn-revive-shield').addEventListener('click', () => {
      if (this.scoreMgr.saveData.totalEnergy < 50 || this.scoreMgr.reviveUsed) {
        this.showToast('ENERGÍA INSUFICIENTE O ESCUDO YA UTILIZADO');
        return;
      }
      this.audio.playEnergyPickup(5);
      this.scoreMgr.saveData.totalEnergy -= 50;
      this.scoreMgr.reviveUsed = true;
      this.scoreMgr.persist();

      this.player.isDead = false;
      this.player.shieldTimer = 3.5;
      this.state = 'PLAYING';
      document.getElementById('modal-gameover').classList.add('hidden');
      document.getElementById('screen-hud').classList.remove('hidden');
      this.audio.startMusic();
      this.refreshAllUI();
      this.showToast('ESCUDO DE EMERGENCIA ACTIVADO (3.5s INVULNERABLE)');
    });

    // 3D Hangar Shop Modal & Controls
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      this.audio.playUIClick();
      this.openHangarModal();
    });

    document.getElementById('btn-close-shop').addEventListener('click', () => {
      this.audio.playUIClick();
      this.hangarStudio.isActive = false;
      document.getElementById('modal-shop').classList.add('hidden');
      this.refreshAllUI();
    });

    document.getElementById('btn-preview-pose').addEventListener('click', (e) => {
      this.audio.playUIClick();
      this.hangarStudio.poseMode = this.hangarStudio.poseMode === 'RUN' ? 'IDLE' : 'RUN';
      e.currentTarget.textContent = `POSE: ${this.hangarStudio.poseMode === 'RUN' ? 'CARRERA' : 'INSPECCIÓN'}`;
    });

    document.querySelectorAll('.shop-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playUIClick();
        this.activeShopFilter = btn.getAttribute('data-filter') || 'ALL';
        document.querySelectorAll('.shop-filter-btn').forEach(b => {
          b.classList.remove('bg-cyan/20', 'border-cyan', 'text-cyan', 'font-bold');
        });
        btn.classList.add('bg-cyan/20', 'border-cyan', 'text-cyan', 'font-bold');
        this.renderShopItems();
      });
    });

    // Settings Modal
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.audio.playUIClick();
      this.openSettingsModal();
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.audio.playUIClick();
      document.getElementById('modal-settings').classList.add('hidden');
    });

    const speedSlider = document.getElementById('inp-transition-speed');
    speedSlider.addEventListener('input', () => {
      document.getElementById('lbl-transition-speed').textContent = parseFloat(speedSlider.value).toFixed(2) + ' s';
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.audio.playUIClick();
      const s = this.scoreMgr.saveData.settings;
      s.transitionDuration = parseFloat(document.getElementById('inp-transition-speed').value) || 0.20;
      s.cameraMode = document.getElementById('sel-camera-mode').value;
      s.graphics = document.getElementById('sel-graphics').value;
      s.customSeed = document.getElementById('inp-custom-seed').value.trim().toUpperCase();
      s.music = document.getElementById('chk-music').checked;
      s.sfx = document.getElementById('chk-sfx').checked;
      s.touchpad = document.getElementById('chk-touchpad').checked;

      this.scoreMgr.persist();
      this.applySavedSettings();
      this.refreshAllUI();
      document.getElementById('modal-settings').classList.add('hidden');
      this.showToast('PARÁMETROS DEL SISTEMA ACTUALIZADOS');
    });

    document.getElementById('btn-reset-save').addEventListener('click', () => {
      localStorage.removeItem(this.scoreMgr.storageKey);
      this.scoreMgr.loadSaveData();
      this.applySavedSettings();
      this.refreshAllUI();
      document.getElementById('modal-settings').classList.add('hidden');
      this.showToast('PROGRESO REINICIADO A VALORES DE FÁBRICA');
    });

    document.getElementById('btn-quick-mute').addEventListener('click', () => {
      this.audio.isMuted = !this.audio.isMuted;
      const icon = document.getElementById('icon-quick-mute');
      icon.className = this.audio.isMuted ? 'fa-solid fa-volume-xmark text-hazard' : 'fa-solid fa-volume-high text-cyan';
      if (this.audio.isMuted) this.audio.stopMusic();
      else if (this.state === 'PLAYING') this.audio.startMusic();
    });

    // Architecture & GitHub Code Exporter Modal
    this.activeExportTab = 'html';

    document.getElementById('btn-open-arch').addEventListener('click', () => {
      this.audio.playUIClick();
      document.getElementById('modal-arch').classList.remove('hidden');
      this.updateExportViewer(this.activeExportTab);
    });
    document.getElementById('btn-close-arch').addEventListener('click', () => {
      this.audio.playUIClick();
      document.getElementById('modal-arch').classList.add('hidden');
    });

    document.querySelectorAll('.export-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playUIClick();
        const tab = btn.getAttribute('data-export-tab') || 'html';
        this.activeExportTab = tab;
        document.querySelectorAll('.export-tab-btn').forEach(b => {
          b.classList.remove('bg-cyan/20', 'border-cyan', 'text-cyan', 'font-bold');
        });
        btn.classList.add('bg-cyan/20', 'border-cyan', 'text-cyan', 'font-bold');
        this.updateExportViewer(tab);
      });
    });

    document.getElementById('btn-copy-export').addEventListener('click', () => {
      this.audio.playUIClick();
      const textarea = document.getElementById('export-code-textarea');
      textarea.select();
      document.execCommand('copy');
      this.showToast(`CÓDIGO DE ${this.activeExportTab.toUpperCase()} COPIADO AL PORTAPAPELES`);
    });

    document.getElementById('btn-dl-html').addEventListener('click', () => {
      this.audio.playUIClick();
      const files = this.generateSeparatedGitHubFiles();
      this.triggerFileDownload('index.html', files.html, 'text/html');
      this.showToast('DESCARGANDO index.html');
    });

    document.getElementById('btn-dl-css').addEventListener('click', () => {
      this.audio.playUIClick();
      const files = this.generateSeparatedGitHubFiles();
      this.triggerFileDownload('styles.css', files.css, 'text/css');
      this.showToast('DESCARGANDO styles.css');
    });

    document.getElementById('btn-dl-js').addEventListener('click', () => {
      this.audio.playUIClick();
      const files = this.generateSeparatedGitHubFiles();
      this.triggerFileDownload('game.js', files.js, 'application/javascript');
      this.showToast('DESCARGANDO game.js');
    });

    document.getElementById('btn-dl-bundle').addEventListener('click', () => {
      this.audio.playUIClick();
      const clean = document.documentElement.cloneNode(true);
      this.cleanExportDOM(clean);
      const fullHtml = '<!DOCTYPE html>\n' + clean.outerHTML;
      this.triggerFileDownload('index.html', fullHtml, 'text/html');
      this.showToast('DESCARGANDO VERSIÓN AUTOCONTENIDA index.html');
    });
  }

  cleanExportDOM(root) {
    root.querySelectorAll('script[src="./vendor/three.min.js"]').forEach(el => { el.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; });
    root.querySelectorAll('#canvas-container canvas').forEach(el => el.remove());
    root.querySelectorAll('[id^="modal-"], #screen-hud, #countdown, #danger-cue').forEach(el => el.classList.add('hidden'));
    root.querySelectorAll('#top-nav-bar, #screen-main-menu').forEach(el => el.classList.remove('hidden'));
    const toast = root.querySelector('#toast-msg');
    if (toast) toast.classList.add('opacity-0', 'translate-y-4');
    const flash = root.querySelector('#screen-flash');
    if (flash) flash.style.opacity = '0';
    const text = root.querySelector('#export-code-textarea');
    if (text) { text.textContent = ''; text.value = ''; }
  }

  generateSeparatedGitHubFiles() {
    const styleEl = document.querySelector('head style');
    const cssContent = styleEl ? styleEl.innerHTML.trim() : '';

    const scriptEl = document.getElementById('engine-script') || document.querySelector('body script');
    const jsContent = scriptEl ? scriptEl.innerHTML.trim() : '';

    const bodyClone = document.body.cloneNode(true);
    this.cleanExportDOM(bodyClone);
    const cloneScript = bodyClone.querySelector('#engine-script') || bodyClone.querySelector('script');
    if (cloneScript) cloneScript.remove();

    const htmlContent = [
      '<!DOCTYPE html>',
      '<html lang="es" class="dark">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />',
      '  <title>GRAVITY SHIFT // Brutalist 3D Endless Runner</title>',
      '',
      '  <!-- Tailwind CSS -->',
      '  <script src="https://cdn.tailwindcss.com"><\/script>',
      '',
      '  <!-- FontAwesome Icons -->',
      '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />',
      '',
      '  <!-- Google Fonts: Space Grotesk & JetBrains Mono -->',
      '  <link rel="preconnect" href="https://fonts.googleapis.com">',
      '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet">',
      '',
      '  <!-- Three.js r128 -->',
      '  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>',
      '',
      '  <!-- Tailwind Theme Config -->',
      '  <script>',
      '    tailwind.config = {',
      "      darkMode: 'class',",
      '      theme: {',
      '        extend: {',
      '          colors: {',
      "            void: '#10151D',",
      "            steel: '#263747',",
      "            cyan: '#00D9FF',",
      "            coldwhite: '#F2F4F5',",
      "            hazard: '#FF654A'",
      '          },',
      '          fontFamily: {',
      "            sans: ['Space Grotesk', 'sans-serif'],",
      "            mono: ['JetBrains Mono', 'monospace']",
      '          }',
      '        }',
      '      }',
      '    };',
      '  <\/script>',
      '',
      '  <!-- Hoja de estilos externa -->',
      '  <link rel="stylesheet" href="./styles.css" />',
      '</head>',
      '<body>',
      bodyClone.innerHTML.trim(),
      '',
      '  <!-- Motor 3D principal externo -->',
      '  <script src="./game.js"><\/script>',
      '</body>',
      '</html>'
    ].join('\n');

    return {
      html: htmlContent,
      css: cssContent,
      js: jsContent
    };
  }

  updateExportViewer(tab) {
    const files = this.generateSeparatedGitHubFiles();
    const textarea = document.getElementById('export-code-textarea');
    const copyLabel = document.getElementById('lbl-copy-export');
    if (tab === 'css') {
      textarea.value = files.css;
      copyLabel.textContent = 'COPIAR styles.css AL PORTAPAPELES';
    } else if (tab === 'js') {
      textarea.value = files.js;
      copyLabel.textContent = 'COPIAR game.js AL PORTAPAPELES';
    } else {
      textarea.value = files.html;
      copyLabel.textContent = 'COPIAR index.html AL PORTAPAPELES';
    }
    textarea.scrollTop = 0;
  }

  triggerFileDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  triggerSurfaceShift(surfaceKey) {
    const shifted = this.gravitySys.shiftTo(surfaceKey);
    if (shifted) {
      this.audio.playShiftSound(surfaceKey);
      this.player.emitBurst(18, PALETTE.CYAN);
      this.world.notifySurfaceShift(surfaceKey);
      this.flashScreen('rgba(0, 217, 255, 0.14)');
      this.updateCompassUI(surfaceKey);
    }
  }

  updateCompassUI(surfaceKey) {
    const surf = SURFACES[surfaceKey] || SURFACES.FLOOR;
    document.getElementById('hud-surface-name').textContent = surf.label;
    const arrow = document.getElementById('hud-compass-arrow');
    if (arrow) {
      arrow.style.transform = `rotate(${surf.compassArrowRot - 45}deg)`;
    }
  }

  flashScreen(colorCss) {
    const el = document.getElementById('screen-flash');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.style.backgroundColor = colorCss;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 140);
  }

  showToast(msg) {
    const toast = document.getElementById('toast-msg');
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 2500);
  }

  startNewRun() {
    this.rng.setSeed(this.scoreMgr.saveData.settings.customSeed);
    this.scoreMgr.resetRun();
    this.currentSpeed = this.baseSpeed;
    this.gravitySys.setSurfaceImmediate('FLOOR');
    this.player.reset();
    this.world.resetWorld();
    this.world.notifySurfaceShift('FLOOR');

    this.state = 'COUNTDOWN';
    this.countdownRemaining = 3;
    this.fixedAccumulator = 0;
    document.getElementById('countdown-number').textContent = '3';
    document.getElementById('countdown').classList.remove('hidden');
    document.getElementById('danger-cue').classList.add('hidden');
    document.getElementById('top-nav-bar').classList.add('hidden');
    document.getElementById('screen-main-menu').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('modal-gameover').classList.add('hidden');
    document.getElementById('screen-hud').classList.remove('hidden');

    document.getElementById('hud-seed-badge').textContent = 'SEED: ' + this.rng.seedLabel;
    this.updateCompassUI('FLOOR');
    this.updateHUD();
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    document.getElementById('danger-cue').classList.add('hidden');
    this.audio.stopMusic();
    document.getElementById('modal-pause').classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    document.getElementById('modal-pause').classList.add('hidden');
    this.lastTime = performance.now();
    this.fixedAccumulator = 0;
    this.audio.startMusic();
  }

  returnToMainMenu() {
    this.state = 'MENU';
    document.getElementById('countdown').classList.add('hidden');
    document.getElementById('danger-cue').classList.add('hidden');
    this.scoreMgr.persist();
    this.audio.stopMusic();
    this.gravitySys.setSurfaceImmediate('FLOOR');
    this.player.reset();
    this.world.notifySurfaceShift('FLOOR');

    document.getElementById('screen-hud').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('modal-gameover').classList.add('hidden');
    document.getElementById('top-nav-bar').classList.remove('hidden');
    document.getElementById('screen-main-menu').classList.remove('hidden');
    this.refreshAllUI();
  }

  handleGameOver() {
    if (this.state !== 'PLAYING') return;
    document.getElementById('danger-cue').classList.add('hidden');
    this.state = 'GAMEOVER';
    this.player.isDead = true;
    this.audio.stopMusic();
    this.audio.playImpactCrash();
    this.player.emitBurst(45, PALETTE.HAZARD);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.cameraCtrl.triggerShake(0.45, 0.65);
    this.flashScreen('rgba(255, 101, 74, 0.42)');

    const isNewRecord = this.scoreMgr.finalizeRun();

    document.getElementById('screen-hud').classList.add('hidden');
    document.getElementById('modal-gameover').classList.remove('hidden');

    document.getElementById('go-score').textContent = Math.floor(this.scoreMgr.score).toLocaleString();
    document.getElementById('go-distance').textContent = Math.floor(this.scoreMgr.distance) + ' m';
    document.getElementById('go-energy').textContent = '+' + this.scoreMgr.runEnergy;
    document.getElementById('go-best').textContent = this.scoreMgr.saveData.bestScore.toLocaleString();

    const recBadge = document.getElementById('go-new-record-badge');
    recBadge.classList.toggle('hidden', !isNewRecord);

    const reviveBtn = document.getElementById('btn-revive-shield');
    const canRevive = this.scoreMgr.saveData.totalEnergy >= 50 && !this.scoreMgr.reviveUsed;
    reviveBtn.classList.toggle('opacity-40', !canRevive);
    reviveBtn.classList.toggle('cursor-not-allowed', !canRevive);

    this.refreshAllUI();
  }

  openSettingsModal() {
    const s = this.scoreMgr.saveData.settings;
    document.getElementById('inp-transition-speed').value = s.transitionDuration;
    document.getElementById('lbl-transition-speed').textContent = parseFloat(s.transitionDuration).toFixed(2) + ' s';
    document.getElementById('sel-camera-mode').value = s.cameraMode;
    document.getElementById('sel-graphics').value = s.graphics;
    document.getElementById('inp-custom-seed').value = s.customSeed || '';
    document.getElementById('chk-music').checked = !!s.music;
    document.getElementById('chk-sfx').checked = !!s.sfx;
    document.getElementById('chk-touchpad').checked = !!s.touchpad;

    document.getElementById('modal-settings').classList.remove('hidden');
  }

  openHangarModal() {
    this.selectedShopSkinId = this.scoreMgr.saveData.equippedSkin;
    document.getElementById('modal-shop').classList.remove('hidden');
    this.hangarStudio.isActive = true;
    this.renderShopItems();
    this.selectHangarSkin(this.selectedShopSkinId);
    setTimeout(() => this.hangarStudio.resize(), 40);
  }

  selectHangarSkin(skinId) {
    const skin = SKINS_CATALOG.find(s => s.id === skinId) || SKINS_CATALOG[0];
    this.selectedShopSkinId = skin.id;
    this.hangarStudio.loadSkinModel(skin);

    const save = this.scoreMgr.saveData;
    const isUnlocked = save.unlockedSkins.includes(skin.id);
    const isEquipped = save.equippedSkin === skin.id;
    const rMeta = RARITY_META[skin.rarity] || RARITY_META.COMMON;

    const rarityEl = document.getElementById('preview-skin-rarity');
    rarityEl.textContent = rMeta.label;
    rarityEl.style.color = rMeta.colorHex;
    rarityEl.style.backgroundColor = rMeta.badgeBg;
    rarityEl.style.borderColor = rMeta.colorHex;

    document.getElementById('preview-skin-name').textContent = skin.name;
    document.getElementById('preview-skin-subtitle').textContent = skin.subtitle;
    document.getElementById('preview-skin-desc').textContent = skin.description;
    document.getElementById('preview-skin-poly').textContent = skin.polyTag;

    const statusEl = document.getElementById('preview-skin-status');
    statusEl.textContent = isEquipped ? 'EQUIPADO ACTIVO' : (isUnlocked ? 'EN HANGAR' : 'BLOQUEADO');
    statusEl.className = isUnlocked ? 'text-cyan font-bold mt-0.5' : 'text-amber-400 font-bold mt-0.5';

    const adBox = document.getElementById('preview-ad-sdk-box');
    if (skin.unlockType === 'REWARDED_AD' && !isUnlocked) {
      adBox.classList.remove('hidden');
      const sdkInfo = this.adService.getProviderStatusText();
      document.getElementById('ad-sdk-status-pill').textContent = sdkInfo.label;
      document.getElementById('ad-sdk-status-msg').textContent = sdkInfo.detail;
    } else {
      adBox.classList.add('hidden');
    }

    const btn = document.getElementById('btn-preview-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (isEquipped) {
      newBtn.className = 'brutal-btn w-full py-3 rounded font-bold text-sm font-mono border-cyan text-cyan cursor-default';
      newBtn.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5"></i> CHASIS EQUIPADO ACTUALMENTE';
    } else if (isUnlocked) {
      newBtn.className = 'brutal-btn brutal-btn-primary w-full py-3 rounded font-bold text-sm font-mono flex items-center justify-center gap-2';
      newBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> EQUIPAR ESTE CHASIS 3D';
      newBtn.addEventListener('click', () => {
        this.audio.playUIClick();
        save.equippedSkin = skin.id;
        this.scoreMgr.persist();
        this.player.applySkin(skin.id);
        this.selectHangarSkin(skin.id);
        this.renderShopItems();
        this.showToast(`CHASIS ${skin.name} EQUIPADO`);
      });
    } else if (skin.unlockType === 'REWARDED_AD') {
      newBtn.className = 'brutal-btn w-full py-3 rounded font-bold text-sm font-mono border-amber-400 text-amber-300 flex items-center justify-center gap-2';
      newBtn.innerHTML = '<i class="fa-solid fa-film"></i> VER ANUNCIO RECOMPENSADO PARA DESBLOQUEAR';
      newBtn.addEventListener('click', () => {
        this.audio.playUIClick();
        this.adService.requestRewardedAd({
          placementName: 'unlock_aether_valkyrie',
          onRewardGranted: () => {
            this.audio.playEnergyPickup(6);
            if (!save.unlockedSkins.includes(skin.id)) {
              save.unlockedSkins.push(skin.id);
            }
            save.equippedSkin = skin.id;
            this.scoreMgr.persist();
            this.player.applySkin(skin.id);
            this.selectHangarSkin(skin.id);
            this.renderShopItems();
            this.showToast('¡RECOMPENSA PUBLICITARIA COMPLETADA! AETHER VALKYRIE DESBLOQUEADA');
          },
          onAdDismissed: () => {
            this.showToast('ANUNCIO CANCELADO: DEBES COMPLETAR EL VÍDEO PARA OBTENER LA SKIN');
          },
          onProviderUnavailable: () => {
            this.showToast('PROVEEDOR ADMOB / AD-SDK NO CONECTADO EN ESTE ENTORNO');
          }
        });
      });
    } else {
      const canAfford = save.totalEnergy >= skin.cost;
      newBtn.className = `brutal-btn w-full py-3 rounded font-bold text-sm font-mono flex items-center justify-center gap-2 ${canAfford ? 'brutal-btn-primary' : 'opacity-45 cursor-not-allowed'}`;
      newBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> COMPRAR CHASIS 3D (${skin.cost} ENERGÍA)`;
      if (canAfford) {
        newBtn.addEventListener('click', () => {
          this.audio.playEnergyPickup(5);
          save.totalEnergy -= skin.cost;
          save.unlockedSkins.push(skin.id);
          save.equippedSkin = skin.id;
          this.scoreMgr.persist();
          this.player.applySkin(skin.id);
          this.selectHangarSkin(skin.id);
          this.renderShopItems();
          this.showToast(`¡${skin.name} CONSTRUIDO Y EQUIPADO!`);
        });
      }
    }
  }

  renderShopItems() {
    const container = document.getElementById('skins-container');
    const save = this.scoreMgr.saveData;
    document.getElementById('shop-energy-balance').textContent = save.totalEnergy;
    container.innerHTML = '';

    const filteredSkins = SKINS_CATALOG.filter(skin => {
      if (this.activeShopFilter === 'UNLOCKED') return save.unlockedSkins.includes(skin.id);
      if (this.activeShopFilter === 'RARE') return skin.rarity === 'COMMON' || skin.rarity === 'RARE';
      if (this.activeShopFilter === 'EPIC') return skin.rarity === 'EPIC' || skin.rarity === 'LEGENDARY';
      if (this.activeShopFilter === 'SPECIAL') return skin.rarity === 'MYTHIC' || skin.rarity === 'AD_EXCLUSIVE';
      return true;
    });

    filteredSkins.forEach(skin => {
      const isUnlocked = save.unlockedSkins.includes(skin.id);
      const isEquipped = save.equippedSkin === skin.id;
      const isSelected = this.selectedShopSkinId === skin.id;
      const rMeta = RARITY_META[skin.rarity] || RARITY_META.COMMON;

      const card = document.createElement('div');
      card.className = `p-3 rounded bg-void/90 border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
        isSelected
          ? 'border-cyan shadow-[0_0_16px_rgba(0,217,255,0.3)] bg-steel/30'
          : (isEquipped ? 'border-cyan/60' : 'border-steel hover:border-cyan/40')
      }`;

      const hexPrimary = '#' + skin.primaryColor.toString(16).padStart(6, '0');
      const hexSecondary = '#' + skin.secondaryColor.toString(16).padStart(6, '0');

      let priceBadge = '';
      if (isEquipped) {
        priceBadge = `<span class="text-[10px] font-mono font-bold text-cyan"><i class="fa-solid fa-check mr-1"></i>EQUIPADO</span>`;
      } else if (isUnlocked) {
        priceBadge = `<span class="text-[10px] font-mono text-coldwhite/70">DESBLOQUEADO</span>`;
      } else if (skin.unlockType === 'REWARDED_AD') {
        priceBadge = `<span class="text-[10px] font-mono font-bold text-sky-400"><i class="fa-solid fa-film mr-1"></i>ANUNCIO AD</span>`;
      } else {
        priceBadge = `<span class="text-[11px] font-mono font-bold text-amber-400"><i class="fa-solid fa-bolt mr-1"></i>${skin.cost}</span>`;
      }

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold" style="color:${rMeta.colorHex}; background:${rMeta.badgeBg}">
              ${rMeta.label}
            </span>
            ${priceBadge}
          </div>
          <div class="text-base font-extrabold text-coldwhite leading-tight">${skin.name}</div>
          <div class="text-[10px] font-mono text-coldwhite/60 truncate">${skin.subtitle}</div>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-steel/60">
          <div class="flex items-center gap-1.5">
            <span class="w-4 h-4 rounded-sm border border-white/20" style="background:${hexPrimary}"></span>
            <span class="w-4 h-4 rounded-sm border border-white/20" style="background:${hexSecondary}"></span>
            <span class="w-4 h-4 rounded-full border border-white/40" style="background:${skin.glowHex}; box-shadow:0 0 6px ${skin.glowHex}"></span>
          </div>
          <span class="text-[9px] font-mono text-cyan uppercase">VISTA 3D <i class="fa-solid fa-cube ml-0.5"></i></span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.audio.playUIClick();
        this.selectHangarSkin(skin.id);
        this.renderShopItems();
      });

      container.appendChild(card);
    });
  }

  refreshAllUI() {
    const save = this.scoreMgr.saveData;
    const activeSkinObj = SKINS_CATALOG.find(s => s.id === save.equippedSkin) || SKINS_CATALOG[0];

    document.getElementById('nav-energy-count').textContent = save.totalEnergy.toLocaleString();
    document.getElementById('nav-best-score').textContent = save.bestScore.toLocaleString();
    document.getElementById('menu-skins-unlocked').textContent = `${save.unlockedSkins.length}/${SKINS_CATALOG.length}`;
    document.getElementById('stat-best-dist').textContent = save.bestDistance + ' m';
    document.getElementById('stat-active-skin').textContent = activeSkinObj.name;
    document.getElementById('stat-current-seed').textContent = save.settings.customSeed || 'AUTO';
  }

  updateHUD() {
    const completed = this.scoreMgr.missionCompleted;
    const label = completed ? 'RETO COMPLETADO · +75 ENERGÍA' : `RETO ${Math.floor(this.scoreMgr.distance)} / 250 m`;
    document.getElementById('mission-label').textContent = label;
    document.getElementById('mission-bar').style.width = Math.min(100, this.scoreMgr.distance / 2.5) + '%';
    const hazard = this.world.obstacles.some(ob => ob.mesh.position.z < 0 && ob.mesh.position.z > -this.currentSpeed * 1.1 && (ob.type === 'ROTATING' || ob.surfaceKey === this.gravitySys.targetSurface.id));
    const cue = document.getElementById('danger-cue');
    cue.classList.toggle('hidden', !hazard || this.state !== 'PLAYING');
    cue.textContent = 'PELIGRO CERCA · CAMBIA DE SUPERFICIE';
    document.querySelectorAll('.surface-pad-btn').forEach(btn => {
      const active = btn.dataset.surface === this.gravitySys.targetSurface.id;
      btn.classList.toggle('surface-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('hud-score').textContent = Math.floor(this.scoreMgr.score).toLocaleString();
    document.getElementById('hud-distance').textContent = Math.floor(this.scoreMgr.distance);
    document.getElementById('hud-speed').textContent = Math.floor(this.currentSpeed) + ' m/s';
    document.getElementById('hud-energy').textContent = this.scoreMgr.saveData.totalEnergy;
    document.getElementById('hud-multiplier').textContent = 'x' + this.scoreMgr.multiplier.toFixed(1);
    document.getElementById('hud-mult-bar').style.width = Math.min(100, this.scoreMgr.streakProgress * 100) + '%';
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.hangarStudio && this.hangarStudio.isActive) {
      this.hangarStudio.updateAndRender(dt);
    }

    if (this.state === 'MENU') {
      this.world.update(dt, 18.0, 0);
      this.gravitySys.update(dt);
      this.player.update(dt, 18.0, this.gravitySys, true);
      this.cameraCtrl.update(dt, this.player, this.gravitySys, 18.0, true);
    } else if (this.state === 'COUNTDOWN') {
      this.countdownRemaining -= dt;
      document.getElementById('countdown-number').textContent = Math.max(1, Math.ceil(this.countdownRemaining));
      if (this.countdownRemaining <= 0) {
        this.state = 'PLAYING';
        document.getElementById('countdown').classList.add('hidden');
        this.audio.startMusic();
        this.showToast('SUBE AL TECHO · CORRE POR LAS PAREDES');
      }
    } else if (this.state === 'PLAYING') {
      this.fixedAccumulator += dt;
      const step = 1 / 120;
      while (this.fixedAccumulator >= step && this.state === 'PLAYING') {
        const hadMission = this.scoreMgr.missionCompleted;
        this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + this.scoreMgr.distance * 0.025);
        this.scoreMgr.updateFrame(step, this.currentSpeed);
        this.gravitySys.update(step);
        this.player.update(step, this.currentSpeed, this.gravitySys, false);
        this.world.update(step, this.currentSpeed, this.scoreMgr.distance);
        this.world.checkCollisions(this.player, this.gravitySys, () => {
          const previous = this.scoreMgr.multiplier;
          this.scoreMgr.collectOrb();
          this.audio.playEnergyPickup(this.scoreMgr.multiplier);
          this.player.emitBurst(10, PALETTE.CYAN);
          if (this.scoreMgr.multiplier > previous) this.showToast('COMBO ×' + this.scoreMgr.multiplier.toFixed(1));
        }, () => this.handleGameOver());
        if (!hadMission && this.scoreMgr.missionCompleted) this.showToast('RETO COMPLETADO · +75 DE ENERGÍA');
        this.fixedAccumulator -= step;
      }
      this.cameraCtrl.update(dt, this.player, this.gravitySys, this.currentSpeed, false);
      this.updateHUD();
    } else if (this.state === 'GAMEOVER') {
      this.player.update(dt, 0, this.gravitySys, false);
      this.cameraCtrl.update(dt, this.player, this.gravitySys, 0, false);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('load', () => {
  window.gravityShiftGame = new GravityShiftGame();
});
