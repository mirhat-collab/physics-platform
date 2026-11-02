import { Composition } from 'remotion'
import { Promo, DURATION, FPS } from './Promo'

// Три формата одного ролика: Reels/TikTok/Shorts, YouTube и квадрат для ленты
export const Root = () => (
  <>
    <Composition id="Vertical" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="Horizontal" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="Square" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1080} />
  </>
)
