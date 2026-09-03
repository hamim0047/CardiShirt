import numpy as np
import torch
import matplotlib.pyplot as plt

from torch.utils.data import DataLoader

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
)

from dataset import ECGDataset
from mi_model import MICNNLSTM



# =====================================================
# Config
# =====================================================

MODEL_PATH = "../data/mi_model.pt"

BATCH_SIZE = 64

NUM_CLASSES = 2


CLASS_NAMES = [
    "normal",
    "MI",
]



# =====================================================
# Main
# =====================================================

def main():



    # -------------------------------------------------
    # Load dataset
    # -------------------------------------------------

    signals = np.load(
        "../data/signals_mi.npy"
    )


    labels = np.load(
        "../data/labels_mi.npy"
    )


    print(
        "Signals:",
        signals.shape
    )


    print(
        "Labels:",
        labels.shape
    )



    dataset = ECGDataset(
        signals,
        labels
    )


    loader = DataLoader(

        dataset,

        batch_size=BATCH_SIZE,

        shuffle=False

    )



    # -------------------------------------------------
    # Device
    # -------------------------------------------------

    device = torch.device(
        "cpu"
    )


    print(
        "Using device:",
        device
    )



    # -------------------------------------------------
    # Load model
    # -------------------------------------------------

    model = MICNNLSTM(

        in_channels=1,

        num_classes=NUM_CLASSES

    ).to(device)



    model.load_state_dict(

        torch.load(

            MODEL_PATH,

            map_location=device

        )

    )


    model.eval()



    # -------------------------------------------------
    # Prediction
    # -------------------------------------------------

    y_true = []

    y_pred = []

    y_prob = []



    with torch.no_grad():


        for x,y in loader:


            x = x.to(device)



            outputs = model(x)



            probabilities = torch.softmax(

                outputs,

                dim=1

            )



            mi_probability = probabilities[:,1]



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

                mi_probability.cpu().numpy()

            )



    y_true = np.array(
        y_true
    )

    y_pred = np.array(
        y_pred
    )

    y_prob = np.array(
        y_prob
    )



    # -------------------------------------------------
    # Metrics
    # -------------------------------------------------

    accuracy = accuracy_score(

        y_true,

        y_pred

    )


    precision = precision_score(

        y_true,

        y_pred

    )


    recall = recall_score(

        y_true,

        y_pred

    )


    f1 = f1_score(

        y_true,

        y_pred

    )


    auc = roc_auc_score(

        y_true,

        y_prob

    )



    # Confusion matrix

    cm = confusion_matrix(

        y_true,

        y_pred

    )


    tn, fp, fn, tp = cm.ravel()



    specificity = tn / (

        tn + fp

    )



    # -------------------------------------------------
    # Print results
    # -------------------------------------------------

    print()

    print("="*60)

    print(
        "MI MODEL EVALUATION"
    )

    print("="*60)


    print(
        f"Accuracy     : {accuracy:.4f}"
    )

    print(
        f"Precision    : {precision:.4f}"
    )

    print(
        f"Sensitivity  : {recall:.4f}"
    )

    print(
        f"Specificity  : {specificity:.4f}"
    )

    print(
        f"F1-score     : {f1:.4f}"
    )

    print(
        f"ROC-AUC      : {auc:.4f}"
    )



    print()

    print(
        "Confusion Matrix"
    )

    print(cm)



    print()

    print(
        "Classification Report"
    )

    print(

        classification_report(

            y_true,

            y_pred,

            target_names=CLASS_NAMES

        )

    )



    # -------------------------------------------------
    # Save confusion matrix image
    # -------------------------------------------------

    plt.figure(
        figsize=(5,5)
    )


    plt.imshow(
        cm
    )


    plt.title(
        "MI Confusion Matrix"
    )


    plt.colorbar()



    plt.xticks(

        [0,1],

        CLASS_NAMES

    )


    plt.yticks(

        [0,1],

        CLASS_NAMES

    )



    plt.xlabel(
        "Predicted"
    )


    plt.ylabel(
        "Actual"
    )



    for i in range(2):

        for j in range(2):

            plt.text(

                j,

                i,

                cm[i,j],

                ha="center",

                va="center"

            )



    plt.tight_layout()


    plt.savefig(

        "../data/mi_confusion_matrix.png",

        dpi=300

    )


    plt.close()



    # -------------------------------------------------
    # ROC curve
    # -------------------------------------------------

    fpr, tpr, thresholds = roc_curve(

        y_true,

        y_prob

    )


    plt.figure(

        figsize=(6,5)

    )


    plt.plot(

        fpr,

        tpr,

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

        f"MI ROC Curve (AUC={auc:.4f})"

    )


    plt.grid()


    plt.tight_layout()



    plt.savefig(

        "../data/mi_roc_curve.png",

        dpi=300

    )


    plt.close()



    print()

    print(
        "Saved:"
    )

    print(
        "../data/mi_confusion_matrix.png"
    )

    print(
        "../data/mi_roc_curve.png"
    )




if __name__ == "__main__":

    main()