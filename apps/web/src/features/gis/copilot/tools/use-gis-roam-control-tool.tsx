import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { GIS_ROAM_CONFIG } from '../../constants'
import { useGisRoamStore } from '../../stores/gis-roam'

const roamControlSchema = z.object({
  speedAction: z
    .enum(['set_speed', 'speed_up', 'speed_down', 'reset_speed'])
    .optional()
    .describe(
      '时速控制操作：set_speed（设置指定时速），speed_up（加速一个步长），speed_down（减速一个步长），reset_speed（恢复标准巡航时速）'
    ),
  targetSpeedKmh: z
    .number()
    .optional()
    .describe(
      '具体目标物理时速（km/h）。步行范围 2~15 km/h，车辆范围 10~160 km/h，飞机范围 200~950 km/h。系统将以物理加速度平滑过渡'
    ),
  speedBoostKmh: z
    .number()
    .optional()
    .describe(
      '动作执行期间或额外施加的临时推力加速增量（km/h，例如爬升时加速 50km/h 或盘旋时加速 80km/h）'
    ),
  directionAction: z
    .enum(['steer', 'reset'])
    .optional()
    .describe('航向控制操作：steer（微调航向角度），reset（恢复正向航道航向）'),
  turnDirection: z
    .enum(['left', 'right'])
    .optional()
    .describe('转向或盘旋的偏转方向：left（向左）、right（向右）'),
  turnAngleDeg: z
    .number()
    .optional()
    .describe(
      '转向或盘旋的具体偏转角度（度，根据用户指定，如 15、30、45、60、90 等；负数表示向左，正数表示向右）'
    ),
  deltaAltitudeMeters: z
    .number()
    .optional()
    .describe('飞机爬升或俯冲的具体高差（米，根据用户需求指定，如 200、300、500、800、1000 等）'),
  entityAction: z
    .enum([
      'jump',
      'pause_briefly',
      'lane_change_left',
      'lane_change_right',
      'airdrop',
      'pitch_up',
      'pitch_down',
      'roll_turn',
      'roll_turn_left',
      'roll_turn_right'
    ])
    .optional()
    .describe(
      '载具特定执行动作：jump（行人跳跃），pause_briefly（停留 3 秒后继续），lane_change_left（向左变道超车），lane_change_right（向右变道超车），airdrop（客机释放降落伞空投箱），pitch_up（仰角爬升，客机或歼-20，配合 deltaAltitudeMeters），pitch_down（俯冲，客机或歼-20，配合 deltaAltitudeMeters），roll_turn / roll_turn_left / roll_turn_right（客机：水平偏航后回到航线，机翼保持水平。歼-20 不转弯：左压、左压坡度用 turnDirection: left；右压、右压坡度用 turnDirection: right；turnAngleDeg 用用户说的角度，如左压30度传 30，右压75度传 75。改平传 turnAngleDeg: 0）'
    ),
  playbackAction: z
    .enum(['pause', 'resume', 'restart', 'stop'])
    .optional()
    .describe(
      '漫游播放控制：pause（暂停），resume（继续），restart（重新从起点开始），stop（停止退出漫游）'
    ),
  viewTarget: z
    .enum(['vehicle', 'airdrop'])
    .optional()
    .describe('相机镜头观察目标：vehicle（跟随主飞机/载具），airdrop（从驾驶舱看向空投箱）'),
  speedMultiplier: z
    .number()
    .optional()
    .describe('漫游播放倍速因子，如 0.5、1、2、4、8、16 等，用于快速倍速漫游')
})

export function useGisRoamControlTool() {
  useFrontendTool({
    name: 'gis_control_roam',
    description:
      '实时控制当前三维 GIS 场景中正在运行的漫游状态。支持实时控制航速（通过 km/h 真实时速加速/减速/定速）、播放倍速（如 2x、4x、8x、16x 高速漫游）、实时控制行驶/飞行方向航向角、实时对漫游对象触发专属指令动作（行人跳跃、驻留3s；车辆左/右变道超车；飞机释放降落伞空投、动态高差爬升/俯冲、绕上轴水平偏航盘旋后机头回到航线并加速）、切换观察视角（跟随客机 vs 从驾驶舱看向空投），以及控制漫游的暂停/继续/重开/停止。',
    parameters: roamControlSchema,
    handler: async ({
      speedAction,
      targetSpeedKmh,
      speedBoostKmh,
      speedMultiplier,
      directionAction,
      turnDirection,
      turnAngleDeg,
      deltaAltitudeMeters,
      entityAction,
      playbackAction,
      viewTarget
    }) => {
      const roamStore = useGisRoamStore.getState()
      const { phase, vehicleType, currentSpeedKmh } = roamStore

      if (phase !== 'roaming' && phase !== 'paused') {
        return {
          status: 'error',
          message: '当前没有正在运行的漫游任务，请先通过 gis_roam 启动漫游后再进行控制。'
        }
      }

      const results: string[] = []

      // 1. 播放倍速控制
      if (typeof speedMultiplier === 'number') {
        roamStore.setSpeedMultiplier(speedMultiplier)
        results.push(`漫游播放倍速已设定为 ${speedMultiplier}x`)
      }

      // 1. 播放状态控制
      if (playbackAction) {
        switch (playbackAction) {
          case 'pause':
            roamStore.pauseRoam()
            results.push('已暂停漫游')
            break
          case 'resume':
            roamStore.resumeRoam()
            results.push('已继续漫游')
            break
          case 'restart':
            roamStore.restartRoam()
            results.push('已重新从起点开始漫游')
            break
          case 'stop':
            roamStore.stopRoam()
            return {
              status: 'success',
              message: '已停止并退出漫游模式。'
            }
        }
      }

      // 2. 速度与加速度控制
      const effectiveSpeedAction =
        speedAction ??
        (typeof targetSpeedKmh === 'number'
          ? 'set_speed'
          : typeof speedBoostKmh === 'number'
            ? 'speed_up'
            : undefined)

      if (effectiveSpeedAction) {
        const config = GIS_ROAM_CONFIG[vehicleType]
        switch (effectiveSpeedAction) {
          case 'set_speed': {
            const speed = targetSpeedKmh ?? roamStore.targetSpeedKmh + (speedBoostKmh ?? 0)
            roamStore.setTargetSpeedKmh(speed)
            results.push(
              `目标时速已设定为 ${speed} km/h（当前时速 ${currentSpeedKmh} km/h，正以 ${config.accelerationMps2} m/s² 平滑加减速过渡）`
            )
            break
          }
          case 'speed_up': {
            if (typeof speedBoostKmh === 'number') {
              roamStore.setTargetSpeedKmh(roamStore.targetSpeedKmh + speedBoostKmh)
              results.push(
                `已加速 ${speedBoostKmh} km/h，新目标时速：${useGisRoamStore.getState().targetSpeedKmh} km/h`
              )
            } else {
              roamStore.speedUp()
              results.push(
                `已加速一个步长（+${config.speedStepKmh} km/h），新目标时速：${useGisRoamStore.getState().targetSpeedKmh} km/h`
              )
            }
            break
          }
          case 'speed_down': {
            roamStore.speedDown()
            results.push(
              `已减速一个步长（-${config.speedStepKmh} km/h），新目标时速：${useGisRoamStore.getState().targetSpeedKmh} km/h`
            )
            break
          }
          case 'reset_speed': {
            roamStore.resetSpeed()
            results.push(`已恢复标准巡航时速（${config.cruiseSpeedKmh} km/h）`)
            break
          }
        }
      }

      // 3. 方向转向控制
      if (directionAction === 'reset') {
        roamStore.resetDirection()
        results.push('航向已回正至标准路线方向')
      } else if (directionAction === 'steer' || typeof turnAngleDeg === 'number') {
        const angle = turnAngleDeg ?? 0
        roamStore.turnDirection(angle)
        results.push(`航向已偏转 ${angle > 0 ? '+' : ''}${angle}°`)
      }

      // 4. 专属动作指令执行
      if (entityAction) {
        switch (entityAction) {
          case 'jump':
            if (vehicleType === 'walk') {
              roamStore.triggerAction({ type: 'jump' })
              results.push('行人正在起跳并以抛物线平稳落地')
            } else {
              results.push('当前载具非行人，跳跃动作仅适用于步行漫游')
            }
            break
          case 'pause_briefly':
            roamStore.triggerAction({ type: 'pause_briefly', durationSeconds: 3 })
            results.push('载具正在原地驻留 3 秒，结束后将自动恢复平滑巡航')
            break
          case 'lane_change_left':
            if (vehicleType === 'vehicle') {
              roamStore.triggerAction({ type: 'lane_change_left', speedBoostKmh })
              results.push(
                `车辆已启动向左变道超车（横移3.5m${speedBoostKmh ? `，提速 +${speedBoostKmh}km/h` : ''}，超车后平滑回归车道）`
              )
            } else {
              results.push('当前载具非汽车，变道超车仅适用于车辆巡航漫游')
            }
            break
          case 'lane_change_right':
            if (vehicleType === 'vehicle') {
              roamStore.triggerAction({ type: 'lane_change_right', speedBoostKmh })
              results.push(
                `车辆已启动向右变道超车（横移3.5m${speedBoostKmh ? `，提速 +${speedBoostKmh}km/h` : ''}，超车后平滑回归车道）`
              )
            } else {
              results.push('当前载具非汽车，变道超车仅适用于车辆巡航漫游')
            }
            break
          case 'airdrop':
            if (vehicleType === 'plane') {
              roamStore.triggerAction({ type: 'airdrop' })
              results.push('客机已释放空投物资箱，正展开降落伞平稳降落至地面')
            } else {
              results.push('投掷空投仅适用于飞机空中飞行漫游')
            }
            break
          case 'pitch_up':
            if (vehicleType === 'plane' || vehicleType === 'fighter') {
              const alt = deltaAltitudeMeters ?? (vehicleType === 'fighter' ? 400 : 500)
              roamStore.triggerAction({ type: 'pitch_up', deltaAltitude: alt, speedBoostKmh })
              results.push(
                `${vehicleType === 'fighter' ? '歼-20' : '客机'}机头仰起，执行爬升动作（+${alt}m${speedBoostKmh ? `，并推力加速 +${speedBoostKmh}km/h` : ''}）`
              )
            } else {
              results.push('爬升指令仅适用于客机或歼-20 空中漫游')
            }
            break
          case 'pitch_down':
            if (vehicleType === 'plane' || vehicleType === 'fighter') {
              const alt = deltaAltitudeMeters ?? (vehicleType === 'fighter' ? 400 : 500)
              roamStore.triggerAction({ type: 'pitch_down', deltaAltitude: alt, speedBoostKmh })
              results.push(
                `${vehicleType === 'fighter' ? '歼-20' : '客机'}机头下俯，执行俯冲动作（-${alt}m${speedBoostKmh ? `，并推力加速 +${speedBoostKmh}km/h` : ''}）`
              )
            } else {
              results.push('俯冲指令仅适用于客机或歼-20 空中漫游')
            }
            break
          case 'roll_turn':
          case 'roll_turn_left':
          case 'roll_turn_right':
            if (vehicleType === 'plane' || vehicleType === 'fighter') {
              let dirSign = 1
              if (entityAction === 'roll_turn_left') {
                dirSign = -1
              } else if (entityAction === 'roll_turn_right') {
                dirSign = 1
              } else if (turnDirection === 'left') {
                dirSign = -1
              } else if (turnDirection === 'right') {
                dirSign = 1
              } else if (typeof turnAngleDeg === 'number' && turnAngleDeg < 0) {
                dirSign = -1
              }
              const angleAbs = Math.abs(turnAngleDeg ?? 30)
              const finalTurnDeg = dirSign * angleAbs
              if (vehicleType === 'fighter') {
                roamStore.triggerAction({ type: 'roll_axis', bankDeg: finalTurnDeg })
                results.push(
                  finalTurnDeg === 0
                    ? '歼-20 已改平，机翼回到水平'
                    : `歼-20 ${dirSign < 0 ? '左压坡度' : '右压坡度'} ${angleAbs}°，机头不离航线，${dirSign < 0 ? '左翼低、右翼高' : '右翼低、左翼高'}`
                )
              } else {
                roamStore.triggerAction({
                  type: 'roll_turn',
                  deltaHeadingDeg: finalTurnDeg,
                  speedBoostKmh
                })
                results.push(
                  `飞机向${dirSign < 0 ? '左' : '右'}偏航盘旋 ${angleAbs}°，机翼保持水平，结束后机头回到航线${speedBoostKmh ? `，并推力加速 +${speedBoostKmh}km/h` : ''}`
                )
              }
            } else {
              results.push('转弯盘旋指令仅适用于客机或歼-20 空中漫游')
            }
            break
        }
      }

      // 5. 视角跟踪目标控制（客机视角 vs 空投追随视角）
      if (viewTarget) {
        if (viewTarget === 'airdrop') {
          const airdropInfo = roamStore.airdropInfo
          if (!airdropInfo?.isDescending) {
            results.push(
              '当前空中暂无正在降落的空投箱。如需查看空投视角，请先让飞机释放空投（entityAction: "airdrop"）'
            )
          } else {
            roamStore.setViewTarget('airdrop')
            const distToGround = Math.max(
              0,
              Math.round(airdropInfo.altitudeMeters - airdropInfo.groundHeight)
            )
            results.push(
              `已从驾驶舱看向空投箱（当前高度：${Math.round(airdropInfo.altitudeMeters)}m，距地约 ${distToGround}m）`
            )
          }
        } else {
          roamStore.setViewTarget('vehicle')
          results.push(
            `已将镜头切回${vehicleType === 'fighter' ? '歼-20' : vehicleType === 'plane' ? '客机' : '载具'}主视角`
          )
        }
      }

      const finalMessage = results.length > 0 ? results.join('；') : '未提供有效的控制指令。'
      return {
        status: 'success',
        message: finalMessage,
        currentSpeedKmh: useGisRoamStore.getState().currentSpeedKmh,
        targetSpeedKmh: useGisRoamStore.getState().targetSpeedKmh,
        vehicleType,
        viewTarget: useGisRoamStore.getState().viewTarget
      }
    },
    render: () => emptyToolRender()
  })
}
