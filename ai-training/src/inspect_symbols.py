from collections import Counter

from prepare_data import (
    load_record,
    TRAIN_RECORDS,
    VAL_RECORDS,
    TEST_RECORDS,
)


def main():

    all_records = (
        TRAIN_RECORDS
        + VAL_RECORDS
        + TEST_RECORDS
    )

    counts = Counter()

    for record_name in all_records:

        _, annotation = load_record(
            record_name
        )

        counts.update(
            annotation.symbol
        )

    print()
    print("=" * 60)
    print("MIT-BIH ANNOTATION SYMBOLS")
    print("=" * 60)

    for symbol, count in counts.most_common():

        print(
            f"{repr(symbol):10s}"
            f"{count:10d}"
        )


if __name__ == "__main__":
    main()