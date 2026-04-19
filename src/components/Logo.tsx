export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        V
      </div>
      <span className="font-bold text-foreground" style={{ fontSize: size * 0.7 }}>
        ValueWise
      </span>
    </div>
  )
}
