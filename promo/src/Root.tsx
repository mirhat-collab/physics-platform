import { Composition } from 'remotion'
import { Promo, DURATION, FPS } from './Promo'

// Три формата ролика × два языка: Reels/TikTok/Shorts, YouTube и квадрат для ленты
const SIZES = [['Vertical', 1080, 1920], ['Horizontal', 1920, 1080], ['Square', 1080, 1080]] as const

export const Root = () => (
  <>
    {SIZES.flatMap(([id, width, height]) => (['ru', 'kk'] as const).map(lang => (
      <Composition key={id + lang} id={lang === 'ru' ? id : `${id}-kk`} component={Promo} defaultProps={{ lang }} durationInFrames={DURATION} fps={FPS} width={width} height={height} />
    )))}
  </>
)
