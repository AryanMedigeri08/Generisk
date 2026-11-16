from fractions import Fraction

F_TABLE = {
    "unrelated": Fraction(0),
    "second_cousins": Fraction(1, 64),
    "first_cousins_once_removed": Fraction(1, 32),
    "first_cousins": Fraction(1, 16),
    "double_first_cousins": Fraction(1, 8),
}


def probability(value: Fraction, *, open_interval: bool = False) -> Fraction:
    if not isinstance(value, Fraction):
        raise ValueError("exact_fraction_required")
    if not (0 < value < 1 if open_interval else 0 <= value <= 1):
        raise ValueError("probability_bounds")
    return value


def mendelian(a: bool, b: bool) -> dict[str, Fraction]:
    if type(a) is not bool or type(b) is not bool:
        raise ValueError("carrier_flags_required")
    if a and b:
        return dict(affected=Fraction(1, 4), carrier=Fraction(1, 2), neither=Fraction(1, 4))
    if a or b:
        return dict(affected=Fraction(0), carrier=Fraction(1, 2), neither=Fraction(1, 2))
    return dict(affected=Fraction(0), carrier=Fraction(0), neither=Fraction(1))


def population_outcomes(q: Fraction, coefficient: Fraction) -> dict[str, Fraction]:
    probability(q, open_interval=True)
    probability(coefficient)
    baseline = q * q
    related = baseline * (1 - coefficient) + q * coefficient
    return dict(related=related, unrelated=baseline, ratio=related / baseline, F=coefficient)


def residual(c: Fraction, d: Fraction) -> Fraction:
    probability(c, open_interval=True)
    probability(d)
    return c * (1 - d) / (1 - c * d)
