# Frederica
A markup language describing LaTeX notation to ASCII art.

## Example
The well-known quadratic formula:
```TeX
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```

```

           ________
          / 2
   -b +- v b  - 4ac
x=------------------
          2a

```

Taylor series of sin:
```TeX
\sin x = \sum^{\infty}_{n=0} \frac{(-1)^n x^{2n+1}}{(2n+1)!}
```

```

         oo       n 2n + 1
      ---     (-1) x
sin x= <     --------------
      ---      (2n + 1)!
         n=0

```

Boltzmann's entropy formula:
```TeX
S=k_B \ln W
```

```

S=k  ln W
   B

```

Newton's equations of motion:
```TeX
m\boldsymbol{a} = m\frac{d^2\boldsymbol{r}}{dt^2} = \boldsymbol{F}
```

```

        2
       d *r*
m*a*=m-------=*F*
          2
        dt

```

Gauss' law of electromagnetism:
```TeX
\int \int_S \epsilon \boldsymbol{E} \cdot d\boldsymbol{S} = \int \int \int_V \rho dV = Q
```

```

 /\ /\                        /\ /\ /\
 |  |   \epsilon *E* . d*S*=  |  |  |   \rho dV=Q
\/ \/                        \/ \/ \/
      S                               V

```

## License
MIT

