// Renders design/icon.svg to assets/icon.png (512×512, alpha): swift design/render.swift design/icon.svg assets/icon.png
import AppKit
let args = CommandLine.arguments
guard let svg = NSImage(contentsOf: URL(fileURLWithPath: args[1])) else { fatalError("cannot load svg") }
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 512, pixelsHigh: 512, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
svg.draw(in: NSRect(x: 0, y: 0, width: 512, height: 512))
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
