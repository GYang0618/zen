import type { PetDefinition } from '../types'

export const PRESET_PETS: readonly PetDefinition[] = [
  {
    id: 'orb',
    number: '#01',
    tag: 'ORIGINAL',
    name: 'Orb',
    chineseName: '球团',
    description: '经典参考原型 · 自适应主题光泽',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 84 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <circle cx="100" cy="100" r="70" className={bodyFillClass} />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="70" fill="var(--primary)"/>
  <rect x="71.5" y="74.5" width="15.0" height="19.0" rx="7.5" fill="var(--primary-foreground)"/>
  <rect x="113.5" y="74.5" width="15.0" height="19.0" rx="7.5" fill="var(--primary-foreground)"/>
</svg>`
  },
  {
    id: 'sprout',
    number: '#02',
    tag: 'SIGNAL',
    name: 'Sprout',
    chineseName: '呆毛天线',
    description: '灵动接收天线，专为语音助手设计',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 88 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass, bodyStrokeClass }) => (
      <>
        <path
          d="M100 38 Q95 20 106 14"
          className={bodyStrokeClass}
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="107" cy="14" r="5" className={bodyFillClass} />
        <circle cx="107" cy="14" r="2.2" fill="var(--pet-eye-color)" />
        <path
          d="M32 112 C32 68 62 38 100 38 C138 38 168 68 168 112 C168 152 138 174 100 174 C62 174 32 152 32 112 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 38 Q95 20 106 14" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <circle cx="107" cy="14" r="5" fill="#FFFFFF"/>
  <path d="M32 112 C32 68 62 38 100 38 C138 38 168 68 168 112 C168 152 138 174 100 174 C62 174 32 152 32 112 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'ghosty',
    number: '#03',
    tag: 'FLOATING',
    name: 'Ghosty',
    chineseName: '浮游灵团',
    description: '底部轻柔波浪裙摆，悬浮飘逸',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 80 },
    animationType: 'float',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M40 98 C40 50 67 24 100 24 C133 24 160 50 160 98 C160 146 152 166 138 166 C126 166 122 150 100 150 C78 150 74 166 62 166 C48 166 40 146 40 98 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 98 C40 50 67 24 100 24 C133 24 160 50 160 98 C160 146 152 166 138 166 C126 166 122 150 100 150 C78 150 74 166 62 166 C48 166 40 146 40 98 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="70.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="70.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'neko',
    number: '#04',
    tag: 'FELINE',
    name: 'Neko',
    chineseName: '几何猫团',
    description: '极简圆润猫耳，灵动宠物神态',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 88 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M42 68 C40 46 58 40 72 54 C84 48 116 48 128 54 C142 40 160 46 158 68 C172 92 172 136 152 158 C132 174 68 174 48 158 C28 136 28 92 42 68 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M42 68 C40 46 58 40 72 54 C84 48 116 48 128 54 C142 40 160 46 158 68 C172 92 172 136 152 158 C132 174 68 174 48 158 C28 136 28 92 42 68 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'pill',
    number: '#05',
    tag: 'PILL',
    name: 'Capsule',
    chineseName: '胶囊豆',
    description: '横向扁长胶囊，最适作为对话框挂件',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 86 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <rect x="25" y="52" width="150" height="106" rx="53" className={bodyFillClass} />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="25" y="52" width="150" height="106" rx="53" fill="#FFFFFF"/>
  <rect x="71.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'peek',
    number: '#06',
    tag: 'PEEKER',
    name: 'Peeker',
    chineseName: '探头球',
    description: '底部裁切构图，适合吸附侧边栏或底栏',
    viewBox: '0 0 200 160',
    headCenter: { x: 100, y: 76 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path d="M22 160 C22 75 56 22 100 22 C144 22 178 75 178 160 Z" className={bodyFillClass} />
    ),
    rawSvg: `<svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 160 C22 75 56 22 100 22 C144 22 178 75 178 160 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="66.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="66.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'baymax',
    number: '#07',
    tag: 'BAYMAX',
    name: 'Baymax',
    chineseName: '大白',
    description: '超能陆战队经典，双眼贯通线联动',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 82 },
    animationType: 'breathe',
    features: { hasBaymaxBridge: true },
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M40 98 C40 52 66 40 100 40 C134 40 160 52 160 98 C160 144 136 160 100 160 C64 160 40 144 40 98 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 98 C40 52 66 40 100 40 C134 40 160 52 160 98 C160 144 136 160 100 160 C64 160 40 144 40 98 Z" fill="#FFFFFF"/>
  <line x1="76" y1="82" x2="124" y2="82" stroke="#111215" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="71.5" y="72.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="72.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'tvbot',
    number: '#08',
    tag: 'CRT BOT',
    name: 'TV-Bot',
    chineseName: '显像盒',
    description: '极简圆角屏幕，天线复古未来感',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 86 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass, bodyStrokeClass }) => (
      <>
        <line
          x1="88"
          y1="46"
          x2="72"
          y2="24"
          className={bodyStrokeClass}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="71" cy="23" r="4.5" className={bodyFillClass} />
        <line
          x1="112"
          y1="46"
          x2="128"
          y2="24"
          className={bodyStrokeClass}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="129" cy="23" r="4.5" className={bodyFillClass} />
        <rect x="36" y="44" width="128" height="114" rx="36" className={bodyFillClass} />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="88" y1="46" x2="72" y2="24" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="112" y1="46" x2="128" y2="24" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="36" y="44" width="128" height="114" rx="36" fill="#FFFFFF"/>
  <rect x="71.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'mushroom',
    number: '#09',
    tag: 'MUSHROOM',
    name: 'Kinoko',
    chineseName: '菌菌菇',
    description: '大圆半球伞盖，五官置于矮胖根茎上',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 134 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <>
        <path
          d="M68 114 C68 106 132 106 132 114 C132 128 140 148 144 158 C144 164 136 166 100 166 C64 166 56 164 56 158 C60 148 68 128 68 114 Z"
          className={bodyFillClass}
        />
        <path
          d="M26 114 C26 56 60 40 100 40 C140 40 174 56 174 114 C174 118 168 122 152 120 C130 117 70 117 48 120 C32 122 26 118 26 114 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M68 114 C68 106 132 106 132 114 C132 128 140 148 144 158 C144 164 136 166 100 166 C64 166 56 164 56 158 C60 148 68 128 68 114 Z" fill="#FFFFFF"/>
  <path d="M26 114 C26 56 60 40 100 40 C140 40 174 56 174 114 C174 118 168 122 152 120 C130 117 70 117 48 120 C32 122 26 118 26 114 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="124.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="124.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'dewdrop',
    number: '#10',
    tag: 'DEWDROP',
    name: 'Dewdrop',
    chineseName: '水滴泡',
    description: '清澈流体弧线，高张力水润感',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 108 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M100 36 C100 36 156 100 156 128 C156 156 130 168 100 168 C70 168 44 156 44 128 C44 100 100 36 100 36 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 36 C100 36 156 100 156 128 C156 156 130 168 100 168 C70 168 44 156 44 128 C44 100 100 36 100 36 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'bao',
    number: '#11',
    tag: 'BAOZI',
    name: 'Bao',
    chineseName: '矮圆小笼包',
    description: '纯净无褶线，矮圆扁平包身带微卷小尖',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 108 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M 28 126 C 28 88 56 68 96 66 C 98 62 101 54 105 50 C 111 45 116 46 114 52 C 112 58 107 63 104 66 C 144 68 172 88 172 126 C 172 152 144 162 100 162 C 56 162 28 152 28 126 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 28 126 C 28 88 56 68 96 66 C 98 62 101 54 105 50 C 111 45 116 46 114 52 C 112 58 107 63 104 66 C 144 68 172 88 172 126 C 172 152 144 162 100 162 C 56 162 28 152 28 126 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'xiaohei',
    number: '#12',
    tag: 'HEIXIU',
    name: 'Xiaohei',
    chineseName: '罗小黑嘿咻',
    description: '原画神级比例，八字尖耳与超大无辜巨眼',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 98 },
    animationType: 'breathe',
    features: { isXiaohei: true },
    renderBody: ({ bodyFillClass }) => (
      <>
        <path d="M58 64 C60 52 70 42 75 44 C78 47 77 56 74 62 Z" className={bodyFillClass} />
        <path d="M142 64 C140 52 130 42 125 44 C122 47 123 56 126 62 Z" className={bodyFillClass} />
        <path
          d="M72 60 C82 58 118 58 128 60 C146 64 162 82 172 108 C179 126 176 142 162 154 C148 166 128 168 100 168 C72 168 52 166 38 154 C24 142 21 126 28 108 C38 82 54 64 72 60 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M58 64 C60 52 70 42 75 44 C78 47 77 56 74 62 Z" fill="#FFFFFF"/>
  <path d="M142 64 C140 52 130 42 125 44 C122 47 123 56 126 62 Z" fill="#FFFFFF"/>
  <path d="M72 60 C82 58 118 58 128 60 C146 64 162 82 172 108 C179 126 176 142 162 154 C148 166 128 168 100 168 C72 168 52 166 38 154 C24 142 21 126 28 108 C38 82 54 64 72 60 Z" fill="#FFFFFF"/>
  <rect x="54.6" y="72.0" width="42.8" height="54.2" rx="21.4" fill="#111215"/>
  <rect x="102.6" y="72.0" width="42.8" height="54.2" rx="21.4" fill="#111215"/>
</svg>`
  },
  {
    id: 'nailong',
    number: '#13',
    tag: 'NAILONG',
    name: 'Nailong',
    chineseName: '奶龙',
    description: '原图二专属复刻：光溜无耳大头与微胖腮颊',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 84 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M100 26 C136 26 156 54 158 88 C160 120 170 148 178 174 C156 174 134 172 100 172 C66 172 44 174 22 174 C30 148 40 120 42 88 C44 54 64 26 100 26 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 26 C136 26 156 54 158 88 C160 120 170 148 178 174 C156 174 134 172 100 172 C66 172 44 174 22 174 C30 148 40 120 42 88 C44 54 64 26 100 26 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="76.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'egg',
    number: '#14',
    tag: 'EGG',
    name: 'Egg',
    chineseName: '极简鸡蛋',
    description: '上窄下阔黄金蛋形，丝滑温润',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 82 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <path
        d="M100 28 C136 28 165 72 165 120 C165 158 136 174 100 174 C64 174 35 158 35 120 C35 72 64 28 100 28 Z"
        className={bodyFillClass}
      />
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 28 C136 28 165 72 165 120 C165 158 136 174 100 174 C64 174 35 158 35 120 C35 72 64 28 100 28 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="72.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="72.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'capybara',
    number: '#15',
    tag: 'CAPYBARA',
    name: 'Lulu',
    chineseName: '水豚噜噜',
    description: '头顶小橘，纯粹极简水豚剪影',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 88 },
    animationType: 'breathe',
    features: { hasCapybaraSnout: true },
    renderBody: ({ bodyFillClass, gaze }) => {
      const sX = gaze.gazeX * 0.5
      const sY = gaze.gazeY * 0.5
      return (
        <>
          <circle cx="100" cy="34" r="11" className={bodyFillClass} />
          <path
            d="M100 23 Q106 18 112 21"
            stroke="var(--pet-eye-color)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          <circle cx="44" cy="74" r="10" className={bodyFillClass} />
          <circle cx="156" cy="74" r="10" className={bodyFillClass} />
          <rect x="42" y="44" width="116" height="126" rx="54" className={bodyFillClass} />
          <g className="snout-group">
            <path
              d={`M${88 + sX} ${126 + sY} C${88 + sX} ${120 + sY}, ${112 + sX} ${120 + sY}, ${112 + sX} ${126 + sY}`}
              stroke="var(--pet-eye-color)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.25"
            />
          </g>
        </>
      )
    },
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="34" r="11" fill="#FFFFFF"/>
  <circle cx="44" cy="74" r="10" fill="#FFFFFF"/>
  <circle cx="156" cy="74" r="10" fill="#FFFFFF"/>
  <rect x="42" y="44" width="116" height="126" rx="54" fill="#FFFFFF"/>
  <rect x="71.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'watermelon',
    number: '#16',
    tag: 'WATERMELON',
    name: 'Suika',
    chineseName: '三角西瓜',
    description: '鲜明三角切片，纯粹几何西瓜块',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 88 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <>
        <path
          d="M100 24 C104 24 168 136 168 144 C140 174 60 174 32 144 C32 136 96 24 100 24 Z"
          className={bodyFillClass}
        />
        <path
          d="M42 144 C72 166 128 166 158 144"
          stroke="var(--pet-eye-color)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 24 C104 24 168 136 168 144 C140 174 60 174 32 144 C32 136 96 24 100 24 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="78.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'dekopon',
    number: '#17',
    tag: 'DEKOPON',
    name: 'Chouju',
    chineseName: '不知火丑橘',
    description: '顶部凸包收腰，沉甸饱满圆柑身',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 114 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <>
        <path d="M96 28 C96 24 100 22 104 22 C105 28 102 34 98 38 Z" className={bodyFillClass} />
        <path
          d="M 76 66 C 76 50 86 38 100 38 C 114 38 124 50 124 66 C 132 68 150 78 162 96 C 176 116 172 144 158 158 C 142 170 122 172 100 172 C 78 172 58 170 42 158 C 28 144 24 116 38 96 C 50 78 68 68 76 66 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M96 28 C96 24 100 22 104 22 C105 28 102 34 98 38 Z" fill="#FFFFFF"/>
  <path d="M 76 66 C 76 50 86 38 100 38 C 114 38 124 50 124 66 C 132 68 150 78 162 96 C 176 116 172 144 158 158 C 142 170 122 172 100 172 C 78 172 58 170 42 158 C 28 144 24 116 38 96 C 50 78 68 68 76 66 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="104.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="104.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'peach',
    number: '#18',
    tag: 'PEACH',
    name: 'Momo',
    chineseName: '仙气水蜜桃',
    description: '饱满心形桃瓣，顶端点缀斜向小桃叶',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 104 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <>
        <path d="M98 44 C108 34 122 36 126 44 C116 48 106 48 98 44 Z" className={bodyFillClass} />
        <path
          d="M 100 44 C 112 56 166 78 166 118 C 166 150 138 168 100 168 C 62 168 34 150 34 118 C 34 78 88 56 100 44 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M98 44 C108 34 122 36 126 44 C116 48 106 48 98 44 Z" fill="#FFFFFF"/>
  <path d="M 100 44 C 112 56 166 78 166 118 C 166 150 138 168 100 168 C 62 168 34 150 34 118 C 34 78 88 56 100 44 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="94.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="94.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'piggy',
    number: '#19',
    tag: 'PIGGY',
    name: 'Piggy',
    chineseName: '嘟嘟小猪',
    description: '折角小圆耳，经典大猪鼻随视线联动',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 92 },
    animationType: 'breathe',
    features: { hasPiggySnout: true },
    renderBody: ({ bodyFillClass, gaze }) => {
      const snoutX = 100 + gaze.gazeX * 0.6
      const snoutY = 118 + gaze.gazeY * 0.6
      return (
        <>
          <path d="M48 66 C42 54 52 46 62 52 Z" className={bodyFillClass} />
          <path d="M152 66 C158 54 148 46 138 52 Z" className={bodyFillClass} />
          <ellipse cx="100" cy="108" rx="72" ry="62" className={bodyFillClass} />
          <g className="snout-group">
            <ellipse
              cx={snoutX}
              cy={snoutY}
              rx={19}
              ry={13}
              stroke="var(--pet-eye-color)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx={snoutX - 6} cy={snoutY} r={2.2} fill="var(--pet-eye-color)" />
            <circle cx={snoutX + 6} cy={snoutY} r={2.2} fill="var(--pet-eye-color)" />
          </g>
        </>
      )
    },
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M48 64 C36 42 56 36 68 50 Z" fill="#FFFFFF"/>
  <path d="M152 64 C164 42 144 36 132 50 Z" fill="#FFFFFF"/>
  <circle cx="100" cy="104" r="66" fill="#FFFFFF"/>
  <ellipse cx="100" cy="118" rx="18" ry="12" stroke="#111215" stroke-width="2" fill="none" opacity="0.4"/>
  <circle cx="94" cy="118" r="2.8" fill="#111215" opacity="0.6"/>
  <circle cx="106" cy="118" r="2.8" fill="#111215" opacity="0.6"/>
  <rect x="71.5" y="74.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="74.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  },
  {
    id: 'poopoo',
    number: '#20',
    tag: 'POOPOO',
    name: 'Poopoo',
    chineseName: '魔性大便君',
    description: '三层圆润饱满椭圆堆叠，顶端自然微弯螺旋角',
    viewBox: '0 0 200 200',
    headCenter: { x: 100, y: 108 },
    animationType: 'breathe',
    renderBody: ({ bodyFillClass }) => (
      <>
        <ellipse cx="100" cy="146" rx="72" ry="28" className={bodyFillClass} />
        <ellipse cx="100" cy="108" rx="55" ry="24" className={bodyFillClass} />
        <path
          d="M 64 78 C 64 63 80 52 100 52 C 105 52 107 48 107 42 C 107 34 115 25 123 20 C 127 18 131 21 129 26 C 126 33 118 38 118 45 C 118 51 126 56 132 63 C 136 68 136 73 136 78 C 136 91 120 100 100 100 C 80 100 64 91 64 78 Z"
          className={bodyFillClass}
        />
      </>
    ),
    rawSvg: `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="146" rx="72" ry="28" fill="#FFFFFF"/>
  <ellipse cx="100" cy="108" rx="55" ry="24" fill="#FFFFFF"/>
  <path d="M 64 78 C 64 63 80 52 100 52 C 105 52 107 48 107 42 C 107 34 115 25 123 20 C 127 18 131 21 129 26 C 126 33 118 38 118 45 C 118 51 126 56 132 63 C 136 68 136 73 136 78 C 136 91 120 100 100 100 C 80 100 64 91 64 78 Z" fill="#FFFFFF"/>
  <rect x="71.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
  <rect x="113.5" y="98.5" width="15.0" height="19.0" rx="7.5" fill="#111215"/>
</svg>`
  }
] as const
