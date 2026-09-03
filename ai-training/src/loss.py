import torch
import torch.nn as nn
import torch.nn.functional as F


class FocalLoss(nn.Module):

    def __init__(
        self,
        weight=None,
        gamma=2.0
    ):

        super().__init__()

        self.weight = weight
        self.gamma = gamma


    def forward(
        self,
        inputs,
        targets
    ):

        ce_loss = F.cross_entropy(
            inputs,
            targets,
            weight=self.weight,
            reduction="none"
        )


        pt = torch.exp(
            -ce_loss
        )


        focal_loss = (
            (1 - pt)
            ** self.gamma
        ) * ce_loss


        return focal_loss.mean()