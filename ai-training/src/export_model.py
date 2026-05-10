import torch
from model import ECGCNNLSTM
from config import MODEL_PATH, SCRIPTED_MODEL_PATH, NUM_CLASSES

device = torch.device("cpu")

model = ECGCNNLSTM(in_channels=3, num_classes=NUM_CLASSES).to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

example = torch.randn(1, 3, 720)
traced = torch.jit.trace(model, example)
traced.save(SCRIPTED_MODEL_PATH)

print("Model exported ✅")
print(f"Saved to {SCRIPTED_MODEL_PATH}")