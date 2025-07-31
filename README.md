# FLUX-Krea

![banner](assets/banner.jpg)

---

This is the official repository for `FLUX.1 Krea [dev]` (AKA `flux-krea`).

The code in this repository and the weights hosted on Huggingface are the open version of [Krea 1](https://www.krea.ai/krea-1), our first image model trained in collaboration with [Black Forest Labs](https://bfl.ai/) to offer superior aesthetic control and image quality.

The repository contains [inference code](https://github.com/krea-ai/flux-krea/blob/main/inference.py) and a [Jupyter Notebook](https://github.com/krea-ai/flux-krea/blob/main/inference.ipynb) to run the model; you can download the weights and inspect the model card [here](https://huggingface.co/black-forest-labs/FLUX.1-Krea-dev).


## Usage

### With `pip`

```
git clone https://github.com/krea-ai/flux-krea.git
cd flux-krea
pip install -r requirements.txt
```

### With [`uv`](https://github.com/astral-sh/uv)

```
git clone https://github.com/krea-ai/flux-krea.git
cd kflux
uv sync
```

### Live Demo

Generate on [krea.ai](https://www.krea.ai/apps/image/flux-krea)

## Running the model

```bash
python inference.py --prompt "a cute cat" --seed 42
```

Check `inference.ipynb` for a full example. It may take a few minutes to download the model weights on your first attempt.

**Recommended inference settings**

- **Resolution** - between `1024` and `1280` pixels.

- **Number of inference steps** - between 28 - 32 steps

- **CFG Guidance** - between 3.5 - 5.0

## How was it made?

Krea 1 was created in as a research collaboration between [Krea](https://www.krea.ai) and [Black Forest Labs](https://bfl.ai).

`FLUX.1 Krea [dev]` is a 12B param. rectified-flow model _distilled_ from Krea 1. This model is a CFG-distilled model and fully compatible with the [FLUX.1 [dev]](https://github.com/black-forest-labs/flux) architecture.

In a nutshell, we ran a large-scale post-training of the pre-trained weights provided by Black Forest Labs.

For more details on the development of this model, [read our technical blog post](https://krea.ai/blog/flux-krea-open-source-release).

## Acknowledgements

We would like to thank the Black Forest Labs team for providing the base model weights. None of this would be possible without their contribution. The post-training work would not be possible without the hard work of our data, infrastructure, and product team who put together a solid foundation for our post-training pipelines.

If you are interested in building large-scale image/video/3D/world models, or the engineering and data infrastructure around it...

> 
> [We are hiring.](https://www.krea.ai/careers)
> 

### Citation

```bib
@misc{flux1kreadev2025,
    author={Sangwu Lee, Titus Ebbecke, Erwann Millon, Will Beddow, Le Zhuo, Iker García-Ferrero, Liam Esparraguera, Mihai Petrescu, Gian Saß, Gabriel Menezes, Victor Perez},
    title={FLUX.1 Krea [dev]},
    year={2025},
    howpublished={\url{https://github.com/krea-ai/flux-krea}},
}
```
