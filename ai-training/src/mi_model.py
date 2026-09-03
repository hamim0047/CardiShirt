import torch
import torch.nn as nn


class MICNNLSTM(nn.Module):

    def __init__(
        self,
        in_channels=1,
        num_classes=2
    ):

        super().__init__()


        self.cnn = nn.Sequential(

            nn.Conv1d(
                in_channels,
                32,
                kernel_size=7,
                padding=3
            ),

            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),


            nn.Conv1d(
                32,
                64,
                kernel_size=5,
                padding=2
            ),

            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),


            nn.Conv1d(
                64,
                128,
                kernel_size=3,
                padding=1
            ),

            nn.BatchNorm1d(128),
            nn.ReLU()

        )



        self.lstm = nn.LSTM(

            input_size=128,

            hidden_size=64,

            batch_first=True,

            num_layers=1,

            bidirectional=False

        )



        self.fc = nn.Sequential(

            nn.Linear(
                64,
                64
            ),

            nn.ReLU(),

            nn.Dropout(0.3),


            nn.Linear(
                64,
                num_classes
            )

        )



    def forward(self,x):


        x = self.cnn(x)


        # (batch, channel, time)
        # ->
        # (batch, time, channel)

        x = x.permute(
            0,
            2,
            1
        )


        x,_ = self.lstm(x)


        # last timestep

        x = x[:,-1,:]


        return self.fc(x)