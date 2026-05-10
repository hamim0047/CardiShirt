import numpy as np
import torch
from sklearn.metrics import classification_report

from dataset import ECGDataset
from model import ECGCNNLSTM
from config import MODEL_PATH, NUM_CLASSES


def main():
    signals = np.load("../data/signals.npy")
    labels = np.load("../data/labels.npy")

    dataset = ECGDataset(signals, labels)
    loader = torch.utils.data.DataLoader(dataset, batch_size=64)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = ECGCNNLSTM(in_channels=3, num_classes=NUM_CLASSES).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()

    y_true, y_pred = [], []

    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            out = model(x)
            preds = torch.argmax(out, dim=1).cpu().tolist()

            y_true.extend(y.tolist())
            y_pred.extend(preds)

    print(
        classification_report(
            y_true,
            y_pred,
            target_names=["normal", "ventricular", "atrial", "other_abnormal"],
        )
    )


if __name__ == "__main__":
    main()