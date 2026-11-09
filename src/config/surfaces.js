import * as THREE from "three";
import { TUNNEL } from "./palette.js";

export const SURFACES = {
  FLOOR: {
    id: "FLOOR",
    label: "SUELO [0°]",
    normal: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(1, 0, 0),
    basePos: new THREE.Vector2(0, -TUNNEL.SURFACE_OFFSET),
    rollAngle: 0,
    compassArrowRot: 0,
  },
  CEILING: {
    id: "CEILING",
    label: "TECHO [180°]",
    normal: new THREE.Vector3(0, -1, 0),
    right: new THREE.Vector3(-1, 0, 0),
    basePos: new THREE.Vector2(0, TUNNEL.SURFACE_OFFSET),
    rollAngle: Math.PI,
    compassArrowRot: 180,
  },
  LEFT: {
    id: "LEFT",
    label: "PARED IZQ [-90°]",
    normal: new THREE.Vector3(1, 0, 0),
    right: new THREE.Vector3(0, 1, 0),
    basePos: new THREE.Vector2(-TUNNEL.SURFACE_OFFSET, 0),
    rollAngle: -Math.PI / 2,
    compassArrowRot: 90,
  },
  RIGHT: {
    id: "RIGHT",
    label: "PARED DER [+90°]",
    normal: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(0, -1, 0),
    basePos: new THREE.Vector2(TUNNEL.SURFACE_OFFSET, 0),
    rollAngle: Math.PI / 2,
    compassArrowRot: -90,
  },
};

export const SURFACE_KEYS = ["FLOOR", "CEILING", "LEFT", "RIGHT"];
