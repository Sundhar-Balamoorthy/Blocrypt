import random

Bit = int

def xor_bits(a, b):
    return [x ^ y for x, y in zip(a, b)]


def int_to_bits(x, n):
    clamped = ((x % (1 << n)) + (1 << n)) % (1 << n)
    return [int(ch) for ch in bin(clamped)[2:].zfill(n)]


def bits_to_int(bits):
    return int(''.join(str(b) for b in bits), 2)


def feistel_f(right, subkey):
    val = bits_to_int(right) ^ subkey
    return int_to_bits(val % (1 << len(right)), len(right))

for _ in range(5):
    L = [random.randint(0, 1) for __ in range(4)]
    R = [random.randint(0, 1) for __ in range(4)]
    K = random.randint(0, 15)
    f = feistel_f(R, K)
    xor = xor_bits(L, f)
    print('L=', L, 'R=', R, 'K=', K, 'f=', f, 'xor=', xor, 'ans=', R + xor)
