import {
  Cartesian2,
  KeyboardEventModifier,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType
} from 'cesium'
import { useEffect, useRef, useState } from 'react'

import { useCesium } from '../cesium-provider'
import {
  clearSelectionHighlight,
  collectTargetsInRectangle,
  describeScenePick,
  rectFromDrag,
  syncSelectionHighlight,
  toScreenRect
} from '../lib/scene-selection'
import { useGisStore } from '../stores/gis'

import type { ScreenSpaceCameraController, Viewer } from 'cesium'
import type { ScreenRect } from '../lib/scene-selection'

/**
 * 框选蒙层。用场景标记同系的青色：边框保持实线，填充压到能看见地形。
 * 深色水面、绿色山体和太空背景上都分得清选区。
 */
const PICK_MARQUEE_BORDER = 'rgba(125, 211, 252, 0.95)'
const PICK_MARQUEE_FILL = 'rgba(14, 165, 233, 0.28)'

type CameraInputSnapshot = {
  enableRotate: boolean
  enableTranslate: boolean
  enableTilt: boolean
  enableLook: boolean
}

export function EntityPickController() {
  const { viewer } = useCesium()
  const activeTool = useGisStore((state) => state.activeTool)
  const pickedTargets = useGisStore((state) => state.pickedTargets)
  const deployedObjects = useGisStore((state) => state.deployedObjects)
  const [box, setBox] = useState<ScreenRect | undefined>()
  const shiftHeldRef = useRef(false)
  const suppressClickRef = useRef(false)
  const dragStartRef = useRef<Cartesian2 | undefined>(undefined)

  useEffect(() => {
    const deployedIds = new Set(deployedObjects.map((object) => object.id))
    syncSelectionHighlight(viewer, pickedTargets, deployedIds)
  }, [viewer, pickedTargets, deployedObjects])

  useEffect(() => {
    return () => clearSelectionHighlight(viewer)
  }, [viewer])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') shiftHeldRef.current = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') shiftHeldRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (activeTool !== 'select') return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    let cameraSnapshot: CameraInputSnapshot | undefined

    const finishDrag = (end: Cartesian2) => {
      const start = dragStartRef.current
      dragStartRef.current = undefined
      setBox(undefined)
      restoreCameraInputs(viewer.scene.screenSpaceCameraController, cameraSnapshot)
      cameraSnapshot = undefined
      if (!start) return

      suppressClickRef.current = true
      const store = useGisStore.getState()
      const rect = rectFromDrag(start, end)
      if (!rect) {
        applyClick(viewer, end, false)
        return
      }
      const targets = collectTargetsInRectangle(viewer, start, end, store.deployedObjects)
      if (shiftHeldRef.current) store.addPickedTargets(targets)
      else store.replacePickedTargets(targets)
    }

    handler.setInputAction(
      (movement: { position: Cartesian2 }) => {
        dragStartRef.current = Cartesian2.clone(movement.position)
        cameraSnapshot = lockCameraInputs(viewer.scene.screenSpaceCameraController)
        setBox(undefined)
      },
      ScreenSpaceEventType.LEFT_DOWN,
      KeyboardEventModifier.ALT
    )

    const trackDrag = (event: PointerEvent) => {
      const start = dragStartRef.current
      if (!start) return
      setBox(toScreenRect(start, canvasPoint(viewer.canvas, event)))
    }
    window.addEventListener('pointermove', trackDrag)

    handler.setInputAction(
      (movement: { position: Cartesian2 }) => {
        finishDrag(movement.position)
      },
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.ALT
    )

    handler.setInputAction((movement: { position: Cartesian2 }) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      applyClick(viewer, movement.position, false)
    }, ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(
      (movement: { position: Cartesian2 }) => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false
          return
        }
        applyClick(viewer, movement.position, true)
      },
      ScreenSpaceEventType.LEFT_CLICK,
      KeyboardEventModifier.SHIFT
    )

    const onWindowMouseUp = (event: MouseEvent) => {
      if (!dragStartRef.current || event.button !== 0) return
      const canvasRect = viewer.canvas.getBoundingClientRect()
      finishDrag(new Cartesian2(event.clientX - canvasRect.left, event.clientY - canvasRect.top))
    }
    window.addEventListener('mouseup', onWindowMouseUp)

    return () => {
      window.removeEventListener('pointermove', trackDrag)
      window.removeEventListener('mouseup', onWindowMouseUp)
      restoreCameraInputs(viewer.scene.screenSpaceCameraController, cameraSnapshot)
      dragStartRef.current = undefined
      setBox(undefined)
      handler.destroy()
    }
  }, [viewer, activeTool])

  if (!box) return null

  return (
    <div
      className="pointer-events-none absolute z-20 border-2"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderColor: PICK_MARQUEE_BORDER,
        backgroundColor: PICK_MARQUEE_FILL
      }}
    />
  )
}

function canvasPoint(canvas: HTMLCanvasElement, event: MouseEvent): Cartesian2 {
  const bounds = canvas.getBoundingClientRect()
  return new Cartesian2(event.clientX - bounds.left, event.clientY - bounds.top)
}

function applyClick(viewer: Viewer, position: Cartesian2, additive: boolean): void {
  const store = useGisStore.getState()
  const target = describeScenePick(
    viewer.scene.pick(position),
    store.deployedObjects,
    viewer.clock.currentTime
  )
  if (!target) {
    if (!additive) store.clearPickedTargets()
    return
  }
  if (additive) store.togglePickedTarget(target)
  else store.replacePickedTargets([target])
}

function lockCameraInputs(controller: ScreenSpaceCameraController): CameraInputSnapshot {
  const snapshot = {
    enableRotate: controller.enableRotate,
    enableTranslate: controller.enableTranslate,
    enableTilt: controller.enableTilt,
    enableLook: controller.enableLook
  }
  controller.enableRotate = false
  controller.enableTranslate = false
  controller.enableTilt = false
  controller.enableLook = false
  return snapshot
}

function restoreCameraInputs(
  controller: ScreenSpaceCameraController,
  snapshot: CameraInputSnapshot | undefined
): void {
  if (!snapshot) return
  controller.enableRotate = snapshot.enableRotate
  controller.enableTranslate = snapshot.enableTranslate
  controller.enableTilt = snapshot.enableTilt
  controller.enableLook = snapshot.enableLook
}
