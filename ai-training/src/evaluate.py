import numpy as np
import torch

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    roc_auc_score,
    roc_curve,
)

import matplotlib.pyplot as plt
import seaborn as sns

from torch.utils.data import DataLoader

from dataset import ECGDataset

from model import ECGCNNLSTM

from config import (
    MODEL_PATH,
    NUM_CLASSES,
    BATCH_SIZE,
)



CLASS_NAMES = [
    "normal",
    "abnormal",
]



def main():


    # =====================================================
    # Load dataset
    # =====================================================

    signals = np.load(
        "../data/signals_combined.npy"
    )


    labels = np.load(
        "../data/labels_combined.npy"
    )


    print(
        "Signals:",
        signals.shape
    )


    print(
        "Labels:",
        labels.shape
    )



    # =====================================================
    # Dataset
    # =====================================================

    dataset = ECGDataset(
        signals,
        labels,
    )


    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=False
    )



    # =====================================================
    # Device
    # =====================================================

    device = torch.device(
        "cpu"
    )


    print(
        "Using device:",
        device
    )



    # =====================================================
    # Load Model
    # =====================================================

    model = ECGCNNLSTM(

        in_channels=1,

        num_classes=NUM_CLASSES,

    ).to(device)



    model.load_state_dict(

        torch.load(

            MODEL_PATH,

            map_location=device

        )

    )


    model.eval()



    # =====================================================
    # Prediction
    # =====================================================

    y_true = []

    y_pred = []

    y_prob = []



    with torch.no_grad():


        for x, y in loader:


            x = x.to(device)



            outputs = model(x)



            probabilities = torch.softmax(
                outputs,
                dim=1
            )


            # abnormal probability

            abnormal_probability = probabilities[:,1]



            predictions = torch.argmax(

                outputs,

                dim=1

            )



            y_true.extend(

                y.numpy()

            )


            y_pred.extend(

                predictions.cpu().numpy()

            )


            y_prob.extend(

                abnormal_probability.cpu().numpy()

            )



    # =====================================================
    # Accuracy + ROC-AUC
    # =====================================================

    accuracy = accuracy_score(

        y_true,

        y_pred

    )


    roc_auc = roc_auc_score(

        y_true,

        y_prob

    )



    print()

    print("="*60)

    print(
        f"Accuracy: {accuracy:.4f}"
    )

    print(
        f"ROC-AUC:  {roc_auc:.4f}"
    )

    print("="*60)



    # =====================================================
    # Classification Report
    # =====================================================

    print()

    print(
        "Classification Report"
    )

    print("="*60)



    print(

        classification_report(

            y_true,

            y_pred,

            labels=[0,1],

            target_names=CLASS_NAMES,

            zero_division=0

        )

    )



    # =====================================================
    # Confusion Matrix
    # =====================================================

    matrix = confusion_matrix(

        y_true,

        y_pred,

        labels=[0,1]

    )


    print(
        "Confusion Matrix"
    )

    print("="*60)

    print(matrix)



    # =====================================================
    # Confusion Matrix Heatmap
    # =====================================================


    matrix_percent = (

        matrix.astype(float)

        /

        matrix.sum(axis=1)[:, np.newaxis]

    ) * 100



    plt.figure(

        figsize=(7,6)

    )


    sns.heatmap(

        matrix_percent,

        annot=True,

        fmt=".2f",

        cmap="Blues",

        xticklabels=CLASS_NAMES,

        yticklabels=CLASS_NAMES,

        linewidths=0.5,

        cbar=True

    )



    plt.xlabel(
        "Predicted Class"
    )


    plt.ylabel(
        "True Class"
    )


    plt.title(
        "Confusion Matrix - CNN-LSTM Arrhythmia Model"
    )


    plt.tight_layout()



    plt.savefig(

        "../data/confusion_matrix.png",

        dpi=300,

        bbox_inches="tight"

    )


    plt.close()



    print()

    print(
        "Saved:"
    )

    print(
        "../data/confusion_matrix.png"
    )



    # =====================================================
    # ROC Curve
    # =====================================================


    fpr, tpr, thresholds = roc_curve(

        y_true,

        y_prob

    )



    plt.figure(

        figsize=(7,6)

    )



    plt.plot(

        fpr,

        tpr,

        label=f"AUC = {roc_auc:.4f}"

    )


    plt.plot(

        [0,1],

        [0,1],

        linestyle="--"

    )



    plt.xlabel(
        "False Positive Rate"
    )


    plt.ylabel(
        "True Positive Rate"
    )


    plt.title(
        "ROC Curve - CNN-LSTM Arrhythmia Model"
    )


    plt.legend()



    plt.grid()



    plt.tight_layout()



    plt.savefig(

        "../data/roc_curve.png",

        dpi=300,

        bbox_inches="tight"

    )


    plt.close()



    print()

    print(
        "Saved:"
    )

    print(
        "../data/roc_curve.png"
    )



    # =====================================================
    # Final Summary
    # =====================================================

    print()

    print("="*60)

    print("Evaluation Completed")

    print("="*60)




if __name__ == "__main__":

    main()