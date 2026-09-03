import numpy as np
import torch
import torch.nn as nn

torch.set_num_threads(4)

from torch.utils.data import DataLoader
from sklearn.model_selection import train_test_split

from sklearn.metrics import (
    f1_score,
    classification_report,
)

from config import (
    BATCH_SIZE,
    EPOCHS,
    LEARNING_RATE,
    MODEL_PATH,
    NUM_CLASSES,
)

from dataset import ECGDataset

from model import ECGCNNLSTM

from loss import FocalLoss



def main():


    # =====================================================
    # Reproducibility
    # =====================================================

    SEED = 42

    np.random.seed(SEED)

    torch.manual_seed(SEED)



    # =====================================================
    # Load Combined Dataset
    # =====================================================

    signals = np.load(
        "../data/signals_combined.npy"
    )


    labels = np.load(
        "../data/labels_combined.npy"
    )


    print(
        "Total signals:",
        signals.shape
    )


    print(
        "Total labels:",
        labels.shape
    )



    # =====================================================
    # Train Validation Split
    # =====================================================

    train_signals, val_signals, train_labels, val_labels = train_test_split(

        signals,

        labels,

        test_size=0.2,

        random_state=42,

        stratify=labels

    )


    print(
        "Train signals:",
        train_signals.shape
    )

    print(
        "Validation signals:",
        val_signals.shape
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
    # Dataset
    # =====================================================


    train_dataset = ECGDataset(
        train_signals,
        train_labels,
    )


    val_dataset = ECGDataset(
        val_signals,
        val_labels,
    )



    # =====================================================
    # DataLoader
    # =====================================================


    train_loader = DataLoader(

        train_dataset,

        batch_size=BATCH_SIZE,

        shuffle=True,

    )


    val_loader = DataLoader(

        val_dataset,

        batch_size=BATCH_SIZE,

        shuffle=False,

    )



    # =====================================================
    # Model
    # =====================================================


    model = ECGCNNLSTM(
    in_channels=1,
    num_classes=NUM_CLASSES,
    )



    # =====================================================
    # Class weights
    # =====================================================


    class_counts = np.bincount(

        train_labels,

        minlength=NUM_CLASSES

    )


    print(
        "Training class counts:",
        class_counts
    )



    class_weights = np.sqrt(

        len(train_labels)

        /

        (

            NUM_CLASSES

            *

            class_counts

        )

    )


    class_weights = np.clip(

        class_weights,

        0.5,

        3.0

    )



    class_weights = torch.tensor(

        class_weights,

        dtype=torch.float32,

        device=device

    )


    print(
        "Class weights:",
        class_weights
    )



    # =====================================================
    # Loss
    # =====================================================


    criterion = FocalLoss(

        weight=class_weights,

        gamma=2.0

    )



    # =====================================================
    # Optimizer
    # =====================================================


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



    # =====================================================
    # Training
    # =====================================================


    best_f1 = 0


    best_epoch = 0



    for epoch in range(EPOCHS):


        model.train()


        train_loss = 0

        train_correct = 0

        train_total = 0



        for x,y in train_loader:


            x = x.to(device)

            y = y.to(device)



            optimizer.zero_grad()



            output = model(x)



            loss = criterion(

                output,

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

                output,

                dim=1

            )


            train_correct += (

                pred == y

            ).sum().item()


            train_total += y.size(0)



        train_loss /= train_total


        train_acc = (

            train_correct

            /

            train_total

        )



        # =================================================
        # Validation
        # =================================================


        model.eval()


        val_loss = 0

        val_correct = 0

        val_total = 0


        true = []

        pred_list = []



        with torch.no_grad():


            for x,y in val_loader:


                x = x.to(device)

                y = y.to(device)



                output = model(x)



                loss = criterion(

                    output,

                    y

                )


                val_loss += (

                    loss.item()

                    *

                    x.size(0)

                )



                pred = torch.argmax(

                    output,

                    dim=1

                )



                val_correct += (

                    pred == y

                ).sum().item()



                val_total += y.size(0)



                true.extend(

                    y.cpu().numpy()

                )


                pred_list.extend(

                    pred.cpu().numpy()

                )



        val_loss /= val_total


        val_acc = (

            val_correct

            /

            val_total

        )



        macro_f1 = f1_score(

            true,

            pred_list,

            average="macro"

        )



        scheduler.step(

            macro_f1

        )



        print(

            f"\nEpoch {epoch+1}/{EPOCHS}"

            f" | train_loss={train_loss:.4f}"

            f" | train_acc={train_acc:.4f}"

            f" | val_loss={val_loss:.4f}"

            f" | val_acc={val_acc:.4f}"

            f" | val_macro_f1={macro_f1:.4f}"

        )



        if macro_f1 > best_f1:


            best_f1 = macro_f1


            best_epoch = epoch + 1



            torch.save(

                model.state_dict(),

                MODEL_PATH

            )


            print(
                "✅ Best model saved"
            )


            print(

                classification_report(

                    true,

                    pred_list,

                    target_names=[

                        "normal",

                        "abnormal"

                    ],

                    zero_division=0

                )

            )



    print()

    print("="*60)

    print(
        "Training Finished"
    )

    print(
        "Best epoch:",
        best_epoch
    )

    print(
        "Best macro F1:",
        best_f1
    )

    print(
        "Model:",
        MODEL_PATH
    )

    print("="*60)




if __name__ == "__main__":

    main()