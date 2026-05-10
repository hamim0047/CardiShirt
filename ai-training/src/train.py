import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from config import BATCH_SIZE, EPOCHS, LEARNING_RATE, MODEL_PATH, NUM_CLASSES
from dataset import ECGDataset
from model import ECGCNNLSTM


def main():
    signals = np.load("../data/signals.npy")
    labels = np.load("../data/labels.npy")

    dataset = ECGDataset(signals, labels)

    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = ECGCNNLSTM(in_channels=3, num_classes=NUM_CLASSES).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    best_acc = 0.0

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)

            optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        model.eval()
        correct = 0
        total = 0

        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                out = model(x)
                preds = torch.argmax(out, dim=1)
                correct += (preds == y).sum().item()
                total += y.size(0)

        acc = correct / total if total > 0 else 0.0

        print(f"Epoch {epoch+1}/{EPOCHS} | loss={train_loss:.4f} | val_acc={acc:.4f}")

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), MODEL_PATH)

    print(f"Best validation accuracy: {best_acc:.4f}")
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()