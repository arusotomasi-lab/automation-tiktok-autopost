"""Shared helper: time-domain WSOLA speed-up (keeps pitch and timbre; the phase vocoder smeared the voice)."""


def wsola_speed(y, rate):
    from audiotsm import wsola
    from audiotsm.io.array import ArrayReader, ArrayWriter
    w = ArrayWriter(1)
    wsola(1, speed=rate, frame_length=512, synthesis_hop=128).run(ArrayReader(y[None, :]), w)
    return w.data[0]
