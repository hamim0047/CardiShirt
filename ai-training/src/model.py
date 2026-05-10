import torch
import torch.nn as nn


class ECGCNNLSTM(nn.Module):
    def __init__(self, in_channels=3, num_classes=4):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv1d(in_channels, 32, kernel_size=7, padding=3),
            nn.ReLU(),
            nn.MaxPool1d(2),

            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.ReLU(),
            nn.MaxPool1d(2),
        )

        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.2,
        )

        self.fc = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, num_classes),
        )

    def forward(self, x):
        # x: (batch, channels, time)
        x = self.cnn(x)          # (batch, 64, time')
        x = x.permute(0, 2, 1)   # (batch, time', 64)
        x, _ = self.lstm(x)
        x = x[:, -1, :]
        return self.fc(x)