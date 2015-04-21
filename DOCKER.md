# Docker commands

```bash
$ docker build -t svgtest
$ docker run -d -p 8080:80 -v $(pwd):/var/www/html --name svgtest svgtest
```
