// The structure is from the MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/TransformStream

import type { CompressStream, BrotliWasmType } from 'brotli-wasm'

interface BrotliCompressTransformer extends Transformer<Uint8Array, Uint8Array> {
  brotliWasm: BrotliWasmType
  outputSize: number
  stream: CompressStream
}

const brotliCompressTransformerBuilder: (
  brotliWasm: BrotliWasmType,
  outputSize: number,
  quality?: number
) => BrotliCompressTransformer = (brotliWasm, outputSize, quality) => ({
  brotliWasm,
  outputSize,
  stream: new brotliWasm.CompressStream(quality),
  start() {},
  transform(chunk, controller) {
    let resultCode
    let inputOffset = 0
    do {
      const input = chunk.slice(inputOffset)
      const result = this.stream.compress(input, this.outputSize)
      controller.enqueue(result.buf)
      resultCode = result.code
      inputOffset += result.input_offset
    } while (resultCode === brotliWasm.BrotliStreamResultCode.NeedsMoreOutput)
    if (resultCode !== brotliWasm.BrotliStreamResultCode.NeedsMoreInput) {
      controller.error(`Brotli compression failed when transforming with code ${resultCode}`)
    }
  },
  flush(controller) {
    let resultCode
    do {
      const result = this.stream.compress(undefined, this.outputSize)
      controller.enqueue(result.buf)
      resultCode = result.code
    } while (resultCode === brotliWasm.BrotliStreamResultCode.NeedsMoreOutput)
    if (resultCode !== brotliWasm.BrotliStreamResultCode.ResultSuccess) {
      controller.error(`Brotli compression failed when flushing with code ${resultCode}`)
    }
  },
})

export class BrotliCompressTransformStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(brotliWasm: BrotliWasmType, outputSize: number, quality?: number) {
    super(brotliCompressTransformerBuilder(brotliWasm, outputSize, quality))
  }
}
