import numpy as np
import torch
import torch.nn as nn

torch.set_num_threads(4)

from torch.utils.data import (
    DataLoader,
    random_split,
    WeightedRandomSampler
)

from sklearn.metrics import (
    f1_score,
    roc_auc_score,
    classification_report,
)

from dataset import ECGDataset

from mi_model import MICNNLSTM



# =====================================================
# Config
# =====================================================

BATCH_SIZE = 64

EPOCHS = 50

LEARNING_RATE = 3e-4

NUM_CLASSES = 2

MODEL_PATH = "../data/mi_model.pt"



CLASS_NAMES = [
    "normal",
    "MI",
]



# =====================================================
# Main
# =====================================================

def main():


    # -------------------------------------------------
    # Seed
    # -------------------------------------------------

    SEED = 42

    np.random.seed(SEED)

    torch.manual_seed(SEED)



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



    # -------------------------------------------------
    # Dataset
    # -------------------------------------------------

    dataset = ECGDataset(
        signals,
        labels
    )



    train_size = int(
        0.8 * len(dataset)
    )


    val_size = (
        len(dataset)
        -
        train_size
    )



    train_dataset, val_dataset = random_split(

        dataset,

        [
            train_size,
            val_size
        ],

        generator=torch.Generator().manual_seed(SEED)

    )



    print()

    print(
        "Train:",
        len(train_dataset)
    )


    print(
        "Validation:",
        len(val_dataset)
    )



    # -------------------------------------------------
    # Class balancing
    # -------------------------------------------------

    train_labels = labels[
        train_dataset.indices
    ]



    counts = np.bincount(

        train_labels,

        minlength=NUM_CLASSES

    )


    print()

    print(
        "Class counts:",
        counts
    )



    # ---------------------------------------------
    # Loss weights
    # ---------------------------------------------

    class_weights = (

        len(train_labels)

        /

        (
            NUM_CLASSES
            *
            counts
        )

    )



    class_weights = torch.tensor(

        class_weights,

        dtype=torch.float32

    )



    print(
        "Class weights:",
        class_weights
    )



    # ---------------------------------------------
    # Weighted sampler
    # ---------------------------------------------

    sample_weights = (

        1.0
        /
        counts[train_labels]

    )


    sample_weights = torch.tensor(

        sample_weights,

        dtype=torch.float32

    )



    sampler = WeightedRandomSampler(

        weights=sample_weights,

        num_samples=len(sample_weights),

        replacement=True

    )



    # -------------------------------------------------
    # DataLoader
    # -------------------------------------------------

    train_loader = DataLoader(

        train_dataset,

        batch_size=BATCH_SIZE,

        sampler=sampler

    )


    val_loader = DataLoader(

        val_dataset,

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
    # Model
    # -------------------------------------------------

    model = MICNNLSTM(

        in_channels=1,

        num_classes=NUM_CLASSES

    ).to(device)



    # -------------------------------------------------
    # Loss
    # -------------------------------------------------

    criterion = nn.CrossEntropyLoss(

        weight=class_weights.to(device)

    )



    # -------------------------------------------------
    # Optimizer
    # -------------------------------------------------

    optimizer = torch.optim.AdamW(

        model.parameters(),

        lr=LEARNING_RATE,

        weight_decay=1e-4

    )



    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(

        optimizer,

        mode="max",

        factor=0.5,

        patience=3

    )



    # -------------------------------------------------
    # Training
    # -------------------------------------------------

    best_auc = 0.0

    patience = 7

    counter = 0



    for epoch in range(EPOCHS):


        # =========================
        # TRAIN
        # =========================

        model.train()


        train_loss = 0

        train_correct = 0

        total = 0



        for x,y in train_loader:


            x = x.to(device)

            y = y.to(device)



            optimizer.zero_grad()



            outputs = model(x)



            loss = criterion(

                outputs,

                y

            )



            loss.backward()



            torch.nn.utils.clip_grad_norm_(

                model.parameters(),

                1.0

            )



            optimizer.step()



            train_loss += (

                loss.item()

                *
                x.size(0)

            )



            pred = torch.argmax(

                outputs,

                dim=1

            )


            train_correct += (

                pred == y

            ).sum().item()



            total += y.size(0)



        train_loss /= total


        train_acc = (

            train_correct
            /
            total

        )



        # =========================
        # VALIDATION
        # =========================

        model.eval()


        y_true=[]

        y_pred=[]

        y_prob=[]


        val_loss=0



        with torch.no_grad():


            for x,y in val_loader:


                x=x.to(device)

                y=y.to(device)



                outputs=model(x)



                loss=criterion(

                    outputs,

                    y

                )


                val_loss += (

                    loss.item()

                    *
                    x.size(0)

                )



                prob=torch.softmax(

                    outputs,

                    dim=1

                )[:,1]



                pred=torch.argmax(

                    outputs,

                    dim=1

                )



                y_true.extend(

                    y.cpu().numpy()

                )


                y_pred.extend(

                    pred.cpu().numpy()

                )


                y_prob.extend(

                    prob.cpu().numpy()

                )



        val_loss /= len(val_dataset)



        val_acc=np.mean(

            np.array(y_true)

            ==
            np.array(y_pred)

        )



        val_auc=roc_auc_score(

            y_true,

            y_prob

        )


        val_f1=f1_score(

            y_true,

            y_pred

        )



        scheduler.step(
            val_auc
        )



        print()

        print(
            f"Epoch {epoch+1}/{EPOCHS}"
        )

        print(

            f"train_loss={train_loss:.4f}"
            f" | train_acc={train_acc:.4f}"

        )


        print(

            f"val_loss={val_loss:.4f}"
            f" | val_acc={val_acc:.4f}"
            f" | val_auc={val_auc:.4f}"
            f" | val_f1={val_f1:.4f}"

        )



        # =========================
        # SAVE BEST
        # =========================

        if val_auc > best_auc:


            best_auc = val_auc

            counter = 0



            torch.save(

                model.state_dict(),

                MODEL_PATH

            )


            print(
                "✅ Best MI model saved"
            )


            print(

                classification_report(

                    y_true,

                    y_pred,

                    target_names=CLASS_NAMES

                )

            )


        else:

            counter += 1



        if counter >= patience:

            print(
                "Early stopping"
            )

            break



    print()

    print("="*60)

    print(
        "Training Finished"
    )

    print(
        "Best ROC-AUC:",
        best_auc
    )

    print(
        "Model:",
        MODEL_PATH
    )

    print("="*60)




if __name__ == "__main__":

    main()