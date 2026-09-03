import numpy as np


CLASS_NAMES = [
    "normal",
    "ventricular",
    "atrial",
    "other_abnormal",
]


def show_distribution(split_name):
    labels = np.load(
        f"../data/labels_{split_name}.npy"
    )

    print()
    print("=" * 60)
    print(split_name.upper())
    print("=" * 60)

    total = len(labels)

    for class_id, class_name in enumerate(CLASS_NAMES):

        count = np.sum(
            labels == class_id
        )

        percentage = (
            count / total * 100
            if total > 0
            else 0
        )

        print(
            f"{class_name:20s}"
            f"{count:8d}"
            f"  {percentage:8.2f}%"
        )

    print(
        f"\nTotal: {total}"
    )


def main():

    show_distribution("train")
    show_distribution("val")
    show_distribution("test")


if __name__ == "__main__":
    main()