import React, { useState, useRef, useEffect } from 'react';

const LOGO_SIMPLE = 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAEEAQIDASIAAhEBAxEB/8QAHQAAAgMBAQEBAQAAAAAAAAAAAAUEBggHAwkBAv/EAFYQAAECBAEFCwgGCAMFBgcAAAECAwAEBREGBxITITEVNUFRU2FxgYKi0QgUImSjssHhIzJCRJGxJCVDUmJjcqE0s8IWFzOS0idUZXN0dSZVg5PD8PH/xAAbAQEAAwEBAQEAAAAAAAAAAAAABAUGAwIHAf/EAD0RAAEDAgMECAQFAwIHAAAAAAEAAgMEEQUhMQYSQVETImFxkbHB0RSBofAjMkJS4RUzcpLxFiRDYnOCsv/aAAwDAQACEQMRAD8AyVhv7x2fjDiE+838/Tdm1vx44N2/VfafKCKZWt7Hez7witw48+3R/QtFotJ9vOva2vZ1Qbietez+cESeLhCfcT1r2fzg3b9V9p8oInEVutb5u9n3REzdv1X2nyg8x3R/TdLotJ9jNva2rb1QRJ4cYb+8dn4wbietez+cG838/Tdm1vx44InEQ61vY72feEQ92/VfafKDz7dH9C0Wi0n2869ra9nVBEnghxuJ617P5wbietez+cETiCE+7fqvtPlBu36r7T5QRQ61vm72fdEQ4ceY7o/pul0Wk+xm3tbVt6oNxPWvZ/OCIw3947PxhxCfeb+fpuza348cG7fqvtPlBFMrW9jvZ94RW4cefbo/oWi0Wk+3nXtbXs6oNxPWvZ/OCJPFwhPuJ617P5wbt+q+0+UETiK3Wt83ez7oiZu36r7T5QeY7o/pul0Wk+xm3tbVt6oIk8OMN/eOz8YNxPWvZ/ODeb+fpuza348cETiIda3sd7PvCIe7fqvtPlB59uj+haLRaT7ede1tezqgiTwQ43E9a9n84NxPWvZ/OCJxBCfdv1X2nyggiMSfd+18ITw4qX6x0fmX0ujvn8Fr2tt6DEPcye5Dvp8YIii75tdr3TFkhDJSr8nMomZlGY0i+cq4Nri3BzmGW6cjy/cV4QRTIp8WTdOR5fuK8IT7mT3Id9PjBFDiyUXexrte8YT7mT3Id9PjDKSmmJOWRLTK8x1F85NibXN+DmMETKE+JPu/a+ETN05Hl+4rwiHUv1jo/MvpdHfP4LXtbb0GCJPEyi75tdr3TH6ilVBaglEuVKOwBQJP94umEMlePKlOMzDWH5hlg3+kmFJaFiDrGcQSOiPbI3vNmi64T1UFM3emeGjtICXQR16QyD1xwJM7WqexfaG0qcI/ECLBIZA6WkAz2IJx3mZZS3+ZVEoYfUH9Ko5drMJj/wCrfuBPpZZRgjV6PJwwPayqlXSePTN/9Efq/JswStNkVWuoPHpWj/8Ajj8dQzN1C4DbLDDxPgs50Xexrte8YmR3xzydJBpgNU3E0yhKb5omJdKzx7UkflCWpeT/AImZQpchVaZNkbEKKm1H8QR/eI7o3N1Cmw7SYbLpLbvBHouC4k+79r4QnjpOO8mGO6WhtyZw5Nqabzs91kB1CRq1kpJA2RQ1UufSSFS5BG0FQ8Y5q4injmG9G4Edhuvyi75tdr3TFkhDJSr8nMomZlGY0i+cq4Nri3BzmGW6cjy/cV4QXVTIp8WTdOR5fuK8IT7mT3Id9PjBFDiyUXexrte8YT7mT3Id9PjDKSmmJOWRLTK8x1F85NibXN+DmMETKE+JPu/a+ETN05Hl+4rwiHUv1jo/MvpdHfP4LXtbb0GCJPEyi75tdr3TBuZPch30+Me0lKvycyiZmUZjSL5yrg2uLcHOYIn0EQ905Hl+4rwg3TkeX7ivCCKtwRM3MnuQ76fGCCKZhv7x2fjDiE+G/vHZ+MOIIoda3sd7PvCK3FkrW9jvZ94RW4IiLhFPi4QREVutb5u9n3RFki14ByQVfGFSNSqKl02jEpIdKfpHhmj6gPB/EdXFeO0EEk79yMXKiVtdBQxGWd26PvTmuY0Wk1KtVBuQpUk/OTTn1W2k3PTzDnjvWTjILNtNGaxVPhjSBJ80lSFLG3UpZ1A6+AHpjsuEMKULClPElQ6e1LI1Z67XccPGpR1mJ1brFLokmZuqzzEozwKcVYk8QG0nmEaOnwaKFu/Obn6L5riW2dXVv6Kgbug/Nx9vqe1RMN4Sw5h5I3KpUuw4BYulOc4e0dcPbgbTYRxPFmXBCFLYw1TtJqIEzNahfjCB8T1RyLG+MsT1unvmo1qbcQbfRoXmN7R9lNhCXFaaEbsQv3ZBcaXZDE693S1Tt2/7jd3h7kLVFcx3g6hrU1VMR06XdT9ZrTBSx2U3P9oqdSy+ZPJMkMzc/PEf93lSB3ymMgQRVyYvK7QALR0+wlEwfivc4/ID181r5WXfCoV6NOqxHO2gf64/trL1hXOGdTqsBxhtB/1Rm6CIrq6Z2pU4bHYWP0nxWnJLL7k8cmFMTc3PyChtL8qSO5nRbaFlKwHWHEtSGKqYtxepKFvBtR6AqxjCVa3zd7PuiIccXTOdquUmxlEf7bnDwPp6r6UtLStF0qCknhBvFfxTgLCWKErNWo0ut9Qt5w2NG6OfOG3ruIxZk5xjifD63jSK3OyyBm/RBwqbO3ag3SfwjuWDPKEmWlNy+KaWl5u1lTUn6K+koJseojoiJI12oVc/Zuto3b9O+9uWR+/ml+U3yeasxTph/CE4KkiwIlHyEPaiNSVfVV15sZzrFLqNHqDtPqslMSU2yc1xl5BQpJ6DH0PwjiqgYpkhN0OpMzaQAVoBs43fgUk6x1x5Y/wFhjHNMMniCmtvqAIamEjNeZJG1KxrHRsNtYMQ/jTGbPCnUWPVELujqm3+hXzpi4RaMtGRHEOAFOVKVz6rQb6pptHpsjidSNnFnDUebZFXifHI2Ru803C1sM8c7N+M3CIrda3zd7PuiLJFbrW+bvZ90R7XVQ4cYb+8dn4wnhxhv7x2fjBE4iHWt7Hez7wiZEOtb2O9n3hBFW4IIIIrhBBBBEnxJ937XwhPDjEn3ftfCE8EUyi75tdr3TFkit0XfNrte6YskERFQSCohKQSTqAEW+Ot+T9krRKtMYsxHLXmVWXIyridTY4HFA/a4QODbt2S6Kjkq5NxnzPJVeL4tBhdOZpfkOJP3qvDIrkYSlLGIcYS91GzktT17BwhTg/0/jxRoBtKUJCUpCUpFgALACPJ1xthlbzziW20JKlrUbBIG0k8AjgmVLKqutJcpOGn1N025Q7Mp9FT9jYhPCE/3PRGtkNNhUNhr9SvlMbMQ2orLk5D/S0ffzKuWUbK1IUVTtNoAbnqgn0VvXuy0er6x5hq/KM45QazU65PtTtVnXZp9RVrWdQ2agNgHMIkQnxJ937XwjJ1ddLVOu85cuC+o4TgVJhbLRNu7i46n2HYEniZRd82u17pj+aXT5+qTrclTZN+bmXDZDTKCpR6hHWcn2QvGE3XpZyvyopNPSCp1wuoW4Rb6qUpJ1m/Ds/tHCOCSX8guplZiNLRNvPIG/PP5DUqmQR3ydlMh+G5ldMnGxOTLZzXVZzrpSeIlPog9EQMbZOsIvzuEXsNrmJaTr02lpRz1KGjUAQpIXrB27Y9yU5YNQe5VkO0MMjwHRPaHXsS2wNhfnyWYoI1fNs5B8AVZ/Dc1hp2pzssgLnHXZEzeiBSDnKUrUBYj6otHlXMh+A8olOZxDk3rMvTm3SdI2hKlsk8WaSFNqHF/YRDdIG6rozHYjZz2Oa06OIyWeaLvY12veMTIu2MskGLcCUlMzPty87IoVZUzJqKkouTbOBAI6bW54pMemuDhcFW8M8czd+M3CT4k+79r4QnhxiT7v2vhCePS6pxg2qVGj4hlp6lzr8nMtklLjSyk7Dq5xzGNXZKMvMtPrZpONNHKzCiEtz6BZtZ2fSD7J5xq6IyLRd82u17pi2U6Sm6jPMyMhLuTMy8oIbabTdSieACOE8Ecrev4qHV0UNU38QfPiF9B81ialgCG32HU7DZSVpI/AgiMr+UT5P5p6JjFWBZVa5UXcm6YgXLQ4VtDaU8aeDg1ah7ZOMpFfyXYiXg3GKXH6cwtKFoCs9cmVAG6T9pNj9XrHPqOkz8lVafL1GnTLU1KTCA4060rOStJ4QYzb3TUEgc3Np8Cs61k2HSBzTdp8Cvl+dW2LJRd7Gu17xjv/lUZEksiax1hGVCWxdypyLSbBPG8gDg4VDr444BRd7Wu17xjR0tUypj32f7LT09Qydm+1TIT4k+79r4Q4hPiT7v2vhEhd0niZRd82u17piHEyi75tdr3TBFZIIIIIqfBBBBE4pv6x0nnv0ujtmcFr3vs6BEzcyR5Dvq8Yh4b+8dn4w4giWzsqxJyy5mWRmOotmquTa5tw8xhbunPcv3E+EOK1vY72feEQ8F0CbxPiaSoknqcmXLKXa4Qka1KPMBcx6YwvcGt1K8SSNiYXvNgMyuo+T1g6bxHUDiGs3VSpRdmm1IAEw6OrWlPDxmw440snUOIQuw/SZKh0aVpNPaDctKthtCePjJ5ydZ5zFFy54yNEpAodPdKZ+dR9IpJ1tNbD1q1jovzRvIYosKpC52vHtPJfGK2ep2kxIMZoTYDkOZ8z4KnZcsdprS3cM0p29ObVaadQojTqH2QR9kH8TzbeHTs0/JzK5aWXmNItmpsDa4vw85h9FbrW+bvZ90RiaqpfUyGR6+t4bh0OHU7YIRkPEnmUbpz3L9xPhDjCtLqGKZ4yTMm9PzAto0Np1i97k22DUNZiuJSVKCQLkmwjV1Il6VkbyaMvGVbfrE2E6U7C88QTYnbmI1jV+ZjrRUgnLnPNmtzJUbGMUdQtYyJu9I82aPU9gXpkxwxTsleDp6vV1llmoPa1BK85YSPqtJOvWTr1atnFFXqFZyz4sUtqlys7TZabUA3mywabQgnbpFC9rcN+iPbJ/jKkz1Rn8SY4n1vz0sR5jLloqbaTtOjSNWdewudfPwxIRlMxnjGvpoOEWJOl6dVkPuo0i2kDas31bOC22wizc+F0TGscQOAGp7+9ZH4WsjqZppYmvfq57/AMjctGjU25/Lv88qowbk3yb/AOyyZdioYln5cXmC0kuBV9bqifqJuDmgcXSYdecPbh5Fjn63ZpnP1DX9GIpeVzAeCqPR6lP1rHU3UcXaMOBDryM51eqwLYBUkW2a9Qi3g/qHIl/6pj/LEV9Q0hzha2Wnz4r0xzHU8Tw9ziXPJJBFzuHS/DkpD+NaZg/LriiVrMqhylVgMNTayjOKLNJAJHCmyiCP/wCFkxkZoj8w9WMmmOZqjom/pNFKTSlNHhCboWCAOI3tCbEGE8LYjyu4qmsV4iapUnJhiyNMhtbhU0nWCq+oW4AdoiDjHJ9KYMkKflAwNX3Z+mysw2tw6QLKRngZwUmwUL+iRbhilmtv2BsforWHoy2MRvLXlrQcrtJsLDPK6tOSjF2IpLH1SyS5Rv051xkmRmHRn6dGbdSSo/XSpNyCdeog8Q4llyyfYowNiOoTUvJPqw4t+8pNIQFoQlWsIUdqSL5vpbbcMdt8pDJ7ibGlTw/ivAYacm5RhV3m5kNOqF0qaKFGw1XXwjbEHI3lExDMYgdyWZWqctU7NNKbl3JpkAvApN23LalAi9lDbs1xDbKW/ist2j1XelmMY+JhtmOs3u4gLL9N/WOk89+l0dszgte99nQImbmSPId9XjFqyl4NTgXKRWaExnmTu2/JqUbktLBIHUbp7MJ5aVmZnSebS7r2jQVr0aCrNSNpNtg54s2vDmhw0K0scjZGB40K/rDGDapiOqt03C9OW/UFEZpBOa2m9ipROoC19Z/ONj5FclFOyf01L8263Uq86mz84UWCAfsNjgTz7TzbBnbJnlincnNMXLNYfp07KqcC3lC7Uw5c21uawbX1XEbBw9VUVfDVPramVSiJuVbmS26RdoKSFWJ2arxQYxNOOocmn6qjxaWcdW1mn6rIPlmsTNKytImmFZiKhT2nic0a1JKmzwcSEww8nPKYcEVJFBqbqzh+ac+0snzRZP1xe/onhHXx3snl109mYomFq+xmLSl52XLqDcKSpKVJ18Xoqt0mOBROo2MqqJrH93gp1KxtRSNa/u8F9GkqbebSpJS424m4I1hQP5iMW+VDk1msB1pNdw8gow7PuGzaUAiUeOso/pOsp6xwCOreSrlFVUJQYJq8wVTUsgqp61HWtoDW3zlO0c1+KOzYww9TcWYbnsP1dkOyc40W16hdJ4FJvsUDYg8YijifJhtSQdOPaOaqI3voKjddp5hfNfdOe5fuJ8ImU39Y6Tz36XR2zOC1732dAj2x/heo4NxdUMOVNBD8o6UhdrBxG1KxzEWPXHjhv7x2fjGua4OAcNCtO1wcLhTNzJHkO+rxjxnZViTllzMsjMdRbNVcm1zbh5jDKIda3sd7PvCPS/Un3TnuX7ifCDdOe5fuJ8IhwQRWTcyR5Dvq8YImQQRJ95v5+m7Nrfjxwbt+q+0+UGJPu/a+EJ4InHn26P6FotFpPt517W17OqNAeTPgxFKpc1iWYut+c+hlyU2s0D6RHSod2M+YSk3qjiSRkJdOc7MOhpA51ah+cbfo1PYpVIladLJszLNJbRfbYC1zzxodnqXpJjK7RvmVi9tK8w0radpzfr3D3Pqv2qz0vTKZM1GbVmsSzSnFnhsBfVzxjXFGNJmv16bq03LkuTDhIGk+qnYlI1cAsI795RtdMpRJOgMqIcnVaZ6x/ZpOodatfZjK0fu0NZ0kohbo3XvXjYrCxBTmqcOs/TuHufIJxu36r7T5QeY7o/pul0Wk+xm3tbVt6oTxZKLvY12veMZ1bddDyJ5KWa1MJxFV5tSabKPAobCc3TKTYm54Ejhi91dyn5Tsp8rS2HS9RaTLrdfcSbB1WckEJ5jcC/EDbgj2wzMInPJ7m2ae6lL8vKvodANikhRUR1pP94p2B8n2UcFurUSotYfS+ypClv8A11oNiPQsbaxe5sY0zIxHHFDGzeDgHOtx7F8+nmM89RVTzCN8ZLGX0HM8ySPvRXmfyjStLqs5h7BmCJqttUqzc4qTAQ22dlgAk5xuCODWDthRgLKBhSsZZZddPpLtJdm6e5LO6dCW86Yz0qAsDtski+0mwirLpOMciE63iNVSkqnTp+YSzONAqznT6StdxqNs6ygdp1w4y44Zl6tjXCtTwvLhyfrSHCdDqDgSlJS4bbNStauIDihNNOW7zhm0jq2GhOViFGhoqHpOiaepK1wEgccyBd28DllqPu1eys5IsUNV+t4lSUzVOdmHZpTqCCptClFWtJIOoHgHBHS0yv6lyOp0n/AmWTs+t9GPwiJiqgYvouTed3ax7ngsZqpRTQOk2fRhxXpG+yGOcdyMlHNMM+4IgSwBrnWBFwDnbn2Lq6sfUQRBz2vDS4AtBGQjOt+Pdklc/gROUHLpiuWmpxUnJU9MupxbdlOLUttOaADqA1KuejjhFlz3SyW0GWwTS64qfo1WCnnJZ1KA60UqT9oC+ao24taTzxS8vFZq1Gy21+ZpFTnKe8sNIU5LPqbUU6JGolJGqL7gzGGSTBWFpPEM++/ivFszLhbynkqcdQ5wouu6WwDqztZO3Xe0U07bPPGxVzB8RHDBKeu0tbZgHHdGZPDPO6p2Gco+VGiUmTMjWZyVprdgyzMSaXUBI1ZoUoXtq2A6uCOw1mpIynZJW8dMMsyOKsKv+dIdaT6KVtWWoWJuUKTY2J2jaeGTkry0SuUKut4cquG5eWYn23EtjS6UHNBOaoFIBukHXHPKrXX8ntZxtgOkSSHpequaBlS3D9AhaTqHGc1dtZ4L64gPZvuybZwz7xxUkh00m6YgyQWOozBNjdc4ym43q+J8Tqr9ZRLqfeZQyhthJbQ2hF7AXJJuVE6zwxoPyPMMTqaLOYumVSvmVVYLEu2hZUsZjigrOFgBrTwExAxBkRqtQyHU+iylLpyMUMzxmXXi4kEoOeM3SW1jNKNXGIvPkmtvSuSJilzKMyZp8/NSzyL3zVh1RI/vESuqGupi2PgbfJeqysjdSlsOgNvlzWeapk0q8pljpWTupol3TUXEPl2VdKwJfPUVE3AIIS2r5xqDygq4nDGSOpplFol35toSErYfVKwQbAcSAojoisZL5BGKcvmM8eqC1ylMWKNIKUPRK0JAdI6CNXMsxQPK5xTuli+Vw1LrBYpbee9Y7XlgGx6E2/ExHJfWVUbH/pFz5+wXu7qqeNjv0i58/ZcQXO11zCv+y71adepAeD7cs6jPS04LjORc3TqJvawN4Tbt+q+0+UOIp8aMNA0CvQANFZaHi6cotYlKrT2yzNSrqXWlhzYQejZzR9BMm2KZPGmDaZiSS9FE4zdaOFtwalo6lAj+8fNaNS+RJipTDkzhGZcUW5lKpqVBOoLSSFgdKbHsmKrF6YSxb41b5Krxan6SLfGrfJWHyyMnrdboUrjOTSlubp1mJtQTcrZUfRJ/pUfwUeKMo7zfz9N2bW/Hjj6T1iny9Wo85S5xAXLzbC2XAeJQsfzj51ZTKRMUDEUxRZrW9JTDrKiBqVmkAEcxGvrjng0+9GYjw8lzwep6SMxnUeSW7t+q+0+UHn26P6FotFpPt517W17OqE8TKLvm12vdMXSuVM3E9a9n84NxPWvZ/OHEEESfdv1X2nyghPBBE4qX6x0fmX0ujvn8Fr2tt6DEPcye5Dvp8YmYb+8dn4w4gitPk2YbmJvKS1PzLQSzTmFvm5BuojMSO9fqjVKE5ywnjMcb8meRKZOs1MjUtaGE9QKj7yY7Et9qUkZyefOazLMLdWriAFyfwBjc4IwQ0QeeNz6L5NtVKajEzGP02Hr6rK+WvE0nU8pFV/SipuUc80QM0kJ0foqA1bM7OPXHM9zJ7kO+nxjxnphc3OvzTpJcecU4onhJNzFqjFzSGWRzzxK+o0sAp4GRD9IA8FW9zJ7kO+nxhlJTTEnLIlpleY6i+cmxNrm/BzGGUVutb5u9n3RHJSF27ydKexW6zPTi33HJKQShSmbqCFuKvmFQ2G2ao9NohZSMouJsX4l3AwXOPsSqZjQIEuvROPKvYEq1GxN9Q1W2x++SjXJaVrVVoMw6htc+2hxjONs5SM66Rxmyr9RjzwfhmewFlllU1mXUmRdm1JlJkj0HUqC0pN9lwVJuNojQR73wUTYzYOdZxHDPL6LEziP+q1Mk7Q5zGAxg6HK5sOJuFaVZHqUmjsqx7jqfcmrFSc+bShpskawnSXKunV0QeTfS25DEGKCJtdSbptpanOlVwpkqWSUC5zc4oSdUeGV+hTzmUuSn6qh1VDm3mGQ7nei2nUFJv9n7R64lYv8AOMkWKxXqDSXXqDNsJRMMBSikKCtYzjfNOwi/GRHZzWRT74ZutYbE5km+h7uKriZaqi6Azb75m3aLANBBBLQedsvNcixTix2uVqYnqpOuLfUtXoKCrNi/1QCNQHFHdlTLO42SY5+pyYZzNR1+gIrNQxFkwxzgnFE65RJKj1RuWW824+ltDzzuaSlSFDWo54AI59e2GxANCyNf+pZ/yxEOODcLnb+9exv/AOwUnEKzp2RRmIxlhcLH/wAZ0smePskmEMX4vqc1MYpVLV6bzFIl0ONnRWQkC7Z9JVwL7RtiHkipEjLKqmRzGeHJFTiEuPMzrYSfOUnXnX+sFgG4PABbURrouWmYflcrVSmZZ1bLzS2VtuIVZSVBtBBBj+8qshX6JW6ZWp3EDs5O1CTQ8iYb+iW2LWKfR2DXtG3XEKpLS91m6Fd6ShmkpoYZJ7h7AWi1i1wAIsRwA5pXk8Zn8O5Y5WhYeXLztTkag+xLh8kNupGeCSRsui51R/GUCrzb2VydNeSzLVPz5CX2mc5SEkZoAB4RYDXF48lPCdKquJ6riecDyp+kvNCVsuyRntqCiRw6o9vKtwjQKDO0zGUs08ifn6mnztRcKkqCU31J4Pq8EVrsnq1GIxjEvhyLu3d29uOvPT1WpmD9En+kRlbAmUup4HxTj7DrVIfnnqjV5p2laIpVmzSlqSkKSSCUn0NmvVs16u3Lyq4PZw5Tq61PuPU2dmPNkzIYWEIUAc69wNltm3XHMcgWFmsT5Q6vlDmZcppzc+87IocH1nVqKr9kH8SOKKaOJrGPMgy9VWYcwRQyOqG9XLxvouq0ZunZI8jfnFTdBMhLKmZxxStb8ys5yhfjUtWaOqMTVnEbdWq03VJ2az5mbeU86rMVrUo3PBzxozyksaYen8UU/Btbnn2aBJOomauZdsrW6u4KWhbXs2ngzuMR6+VdQsMSWRWWqFEoFMkS5OS+jcYk2215ikqNrgX4oUTvh3AvF3SHVW1DL0JaXjrSLMe6cjy/cV4Qn3MnuQ76fGP1ykVVuW85cpk4hjNztIphQTbjva1oscXoIOivgQVW9zJ7kO+nxi2ZOcSpwfiakVNbq2npCZS44lIJJRnekm440kjriPFbrW+bvZ90Qc0OBBRzQ4EHivp3LPNzDDcwysLbcQFoUNigRcGMf+Wphd6Xx9IVqUl7tVKWJcUCAC6iyT3cyNCeTvXDiDI3h2eUbutyolXL7c5olu/Xmg9cVTyvKUZzJ3KVNCLqp86kqPEhYKT3syMvQ3gqw09yyWHuNPW7h5kLFe5k9yHfT4x7SUq/JzKJmZRmNIvnKuDa4twc5h9EOtb2O9n3hGpWuRunI8v3FeEG6cjy/cV4RW4IIpm5k9yHfT4wRZIIIk+G/vHZ+MOIT4k+79r4Qngi1z5OzYRgJ1Vv+JOuK7qR8ItuUlzzfJLiyYBsTTnEA9KSP9UUvyZAP91UsRa/nL1/+aLxlKH/AGQ4kP8AIP5pjdR9XCxb9q+TVA38ddf9/qsKxcIIp8YVfWVcIrda3zd7PuiIcWSi72Ndr3jBEglJh+UmW5qVecZfaUFtuNqKVJUNhBGwxp6n/wDavkekdFOIXWpHN0pWdemQM053FnjXfnHFHDIGcTVzC9QYnqHUHJR5QUldrFKxq1KSdR64n0NW2AuZILscLEeveqfF8NfVtZJAQ2Vhu0nyPYV03ExymzGHJeg12SIklTLbQmHEpziomyApYJ1Xtrt1w7rOUPEeT+SNCxZRGKwpDIDL6H81LyD6Ou6TncR1A6uuOR4zyr4uxXRkUmovSzUsFBa/N2sxTqgbgqNzsIvqtF8yQNYlyl4nptbxQ4Jql4fSUtLW0E6Z0gWBIHpEWST0Djiwin35t2me4uNgCbHLjfuVBV0XQ0okxCKMRt3iQ24N8rFp5k5EcrL8r2UTJ9Xckz9Fn6F5hVpVgtycohg2adtqWhfAL6yDYnWNcWSYeaYw9kddecQ02h9lSlqNgkBoayYMv2CX3X/9qqXLqcBQBPIQLkWGpzotqPFYHjiv4PpOKso0vTaTOuFmg0sZgf0QTYWAzQbekq34cPOmdMyZ0T23dYAWFr2N7lRIYaKaiZVRSbsd3Fwcb7pLSLDnmcuJX65uRjnLzmKCn6ZNTBSbEp0iW2jrBGuxKPwMdXx5k6ws7hWoTzkpMrmZKnuebOOTbqy0EJJSBnKIsDwRzhr/AGdlPKVwvQMNyUvLsUiWclnlNIAK3NC4TnEfWIFgSdd7x23KGof7vcRc1LmT7NUcWxAtkLrE3KrsTr5o6ikbA5zG7jbC/C5GduYAXM/I+NmMVf8AqJf3FR/XlrG+CaH/AO4H/LMUXyW8T1ClYglKFLpZVK1Vwh4rSSpJQFkFNjt4Nd4c5WK3ibHWNv8AYeVl5WZTJTiksqYbUkqNrFSySbBOu/XFMW3sVfvo5GY6ZnEBoG9rwtbzVcyWuTOOsE0nJrTpZ1LsrUnJ6cm1D0GWSLAjjOtXXbjjR+MK9SMlWTdtuQaQlTLfm9PlydbjnGePhUo+MQ8FYfoGSzBEzNzsy2jRt6aoTqxrWRwDhsL2A5+MxkfLJlAnsoWLHKk9nNSDN25GXJ/4Td9p/iO0/hsAiNJAJDY6L1Af6vVERi0LST3k+/0HeomJ5qYnm5ydm3VOzD7mkdWrapSlgk/iY075UqgfJ6pY9Yk/8tUZEom+jPX+RjY/lDLvkRpw/nyvuKjlVR3kjPIq4xJwbU07e0+is+UwJPk5VIBI1YeHB/KEY0jaWPVXyET4/wDAx/lCPn7HHC2brXd684G/ejf3q4RW61vm72fdEQ4slF3sa7XvGLRXi1f5Es6X8kk1LKP+FqjqAOIFDavzJi75fpbzzJDiBuwOYwl3/kWlXwiheRqtRwviFsn0UzTSh1pPhHScsaEu5JcWoUAQKNNK6w0oj8ozk7d2quOYWLqz0eI/MFYZiHWt7Hez7witxMou+bXa90xo1tFDgi4QQREEU+CCJxiT7v2vhCeHFN/WOk89+l0dszgte99nQImbmSPId9XjBFoXyWXM/Jm4m99HPup6NST8Y6VjVkzWSvE7IFyJNxduhN/9Mcq8mF5lqiVeltJzQ1MJfAuT9dOadv8AQI7fTGG52RqVNdGc3NS5Qoc1ik+9G6pfxcMaByt6L5NiP/L444n91/VYiinwynpupSk6/KOvEOMuKbWCgaiDY8EMtzJHkO+rxjC6L6wDcXVbiyUXexrte8YNzJHkO+rxhbOzT8nMrlpZeY0i2amwNri/DzmC/U+hPiT7v2vhDLDdBxriJ1KKRTJuZSr9roQlsdKyAn+8diwRkM0mjm8bziJogXTJyxKQnjCli1+gfjE2lw6oqT1G5c+CqcQxyhw8Hpni/IZnw91yrJXk6q2OKmNGlUtS2lgTM2oah/Cn95X5cMaHxviKh5McIytDo7bTU440W5GXGsiw1ur4+O52nrj+cYY/w5gqmikUJmWem2k5rUtLgBpnnURq6hr6NsZyxhUZyqz0zXp59b0+sg6RSiQkE2sAdQABsBFpJLDhkZjhO9IdTy+/91moaar2hnbPVN3IG5tbxd2n3+Q4ldpySZUgjNomK5oqQo2YnXTe1/suHi/iPXDbKHlaplLk3KThMtzE1YoMyhI0LPOngUf7dMZd3TnuX7ifCDdOe5fuJ8IgDFagRdHf58VaybJ4e+r+JLctd39N+dvTRNMEYom8MY0k8TpbE5MS7i1qS6o/SFaVJVc8fpHXHTcpmPcZLoFPr709KtyWKKZMSokGmjmy7YWEk3J9JZHDqtfZFIoWD5quzSZak0eYm3CbfR52anpN7AdMd1wzkUdqkhSWccTYXJ0xlTcrT5ZZGaFKKjnrB2knXbiGvVEeEyFhaNExmXD6edk8+7vDIjUkWNgBw61jfLvXKchlExRUqvIzmGWEpelVKJmnU/RM3zhdR4TY6hGm8L4eoGTyhzlSnZwLfXd6fqUx9d1R1noFzqSNp4zCnF+O8DZK6Iimsol0PNo/R6ZJAZ5PGr90H95Ws69sZdyjZUMT42qRenZkS8khRMvJtAaNscZv9ZXOf7bI5uAjy1Kqtys2gk3t3o4efFwHn5DtKsnlC5S53Gc4zIyZclqIytRbZ2F5QtZa/wAdQ4I5HDim/rHSee/S6O2ZwWve+zoETNzJHkO+rxjitnS0sVLEIohYBKKJvmz1/kY2D5QBvkVp/wD50t7hjKE5KsScuqZlkZjqLZqrk2ubcPMY1B5ST7zOQimuNrzVl+VBNr/YMeHi5CpcZNqyk/yPor9jtV8hc+P/AAQf5YjAUbwyhurR5P1RcSqyxQQb8+iEYz3MkeQ76vGI9K3dDu9eNmXb0Un+SrcWSi72Ndr3jBuZI8h31eMLZ2afk5lctLLzGkWzU2BtcX4ecxLWlWwfI5YUjBVemj9VyeSgdKUAn3hHQcsDiW8k+LVEgA0abHWWVCKf5H7DreRBM4+bqnJ95wGwFwClH+iH+Xt5LOSHEOf9VyXDRF9oWtKfjFHM3eqPmsLXHfxKw5jzXz8iZRd82u17phxuZI8h31eMeM7KsScsuZlkZjqLZqrk2ubcPMYvFukygit7pz3L9xPhBunPcv3E+EEUOCLJuZI8h31eMEEUPDf3js/GHEJ95v5+m7Nrfjxwbt+q+0+UEXYfJ6qiZLGrki4bJnpZSE/1p9If2Ch1xpKhulqpt6/Rc+jVz32f3tGH8KYkeksSU+cYbLS2JhDudnXuEm5Ta2wgEdcbNlJhuZlWpqXcC23UpcbWk6iCLgiNjs9KJad8J4eRXzTbKnMNWypGjh9R/Flk7yksPqw9lfrLaWS2xOuCdZPAoOa1EdvPHVCiNCeVvhFOIML0rGEsSh2SOgmbIv8ARrOon+lertRmPdv1X2nyjM10Jhnc0rcYPVCpo2PB4W8Pu6cQlWZVOJm1zzbrkol5svpaF1KRqzgL8Nrx/aa0VEAShJPAF/KOk5IcWyWFZednn8PzE3Nz603Xn2CEIFgkXTx3JPRxRzpmMfIA926Odr/Rd6+aSKBzomb7uAuB9SrPPZfWUS+homEptagnNQX15qU8XopBv+IiqTeO8o2LEvtvNTctKkAaGSlloSb3uCdaj0Ex0L/fPKjZheZ/+8P+mItQy9S0jmf/AAnMrz77JoC1rfwc8aGaeOYWfVG3INIWHpaSeldvRYcN7mXg+a5xKYLxbNKAaw7VNfCuWUgfioAQ2GR7HFTllMeYS8oF29N+YSANY4E3P9ossv5QzD68xyg7ni+pxbhfAHQAmHbOU6UrcvopHH9GpT6xq0lHdK08P2l5piIykw86SF3gPOymVGLY83WBrPk53/zdViieTfNqcQqs4kZQi91olGCokcQUq1vwMXunZI8l2Fm/O6qht7M16WpzYCR0j0UnrEJBQMVYjBbp+W9qZWRrbl2EtKt0IXeKnXPJ+xk6p2aGIJOpOn0jpFrDiz0q1X6THR0TIxeKC/aSD6lVZqZ6p25V4hudga5vmGrrFUyq4Ew3JiVpObN5mpDEiyEtjtak26LxzLGGWbE1ZDkvTMyjyqtX0Ju6Rzr4OoCOa4ppuJMMPJar2HpqRzjZC1m6FdCgCD1GEm7fqvtPlFTPUyuNnZdi0+G7OYbCBKz8Q/uJv/CjV9xx6rzDrrinHFkKUpRuSSBckxAjoWA8mmIcoT/nlNb82lFqs5MvJOiRbVa/2jq2AcMdkpGSTJVggNuYxrLVSnSm+jmHMxF+NLSDnHrJERwwkXU6sxqlpHdFm5/7Wi5/hZ0ws246t9DSFLUc3UkXPDFtlMK4nnEZ8rh2rvp/ebk3FD8QI0DI5RcE0FAksIYLrE60q+ulUiyDbhOwnbwiJK8rGICAZTJLi51P8xjR/wCkx5IsquTHqwnqU9v8nAfTJZ4qmT7HLlOcCMJVtRNrASTl9o5o7n5TzTjOQiQadQUOImJVKkkWIIQbiGsvlXxWt1KXMkOJ2km91azbuRTcueLahjPBYoJwdX6W95029nzEsSmyb6tg445Em6iGesrquB0rAAw3ycD6rpWUc28nmpf+wj/KEZEjYOUKWW7kGqEqM4KNESj6uu+jA2RipVVeT9aQWOlR8I8w8VN2WP4Mn+SaRW6zrqbvZ/IRM3b9V9p8ouWRXBysdZTaLLqt5uuYS/MtlNwGW9awTzhNtm0iOpNhcrTveGNLjwW0MllEGGck+GaIWi041JIW8kixDihnL7y1Rz/yr6qZPJ1L05CrGoTiEqHGhAKz3gmOy1JwKnFJBuEDN8YyV5YWKlHGshRG7OsyMtnLQFWzXV2Jv2cz/wDTFXCzflBPesJhwNVim9yN/D+VyWIda3sd7PvCIe7fqvtPlB59uj+haLRaT7ede1tezqi1W9SeCHG4nrXs/nBuJ617P5wROIIT7t+q+0+UEERiT7v2vhCeHFS/WOj8y+l0d8/gte1tvQYh7mT3Id9PjBEUXfNrte6Y1ZkHxAKrhDcx1YMzTVaO19ZbOtJ/MdQjLMlKvycyiZmUZjSL5yrg2uLcHOYvGTXG8phjFUvPKmT5q59FNJCCbtk6zs2g2PVFlhNZ8LUhx0ORVHtDhv8AUKJzG/mGY7xw+YyWw5KWlK1Rahh2opK5ebZUm1+AixtxEaiIwZjjDs9hPFdQw/UEFL0m8UAkalp2pWOYgg9cbhkpofQzkq4laSA42sG4UDrB6CIoflQ5OhjLDLWM6DL59VkGyJhpIALzI1npUjWRxgnmi+x6h329MxY7ZLFhBIaeQ5H7/jwWfMhk5h+l46aq+Ip9qUlpNpa2tIhSs9wjNAsAdgJN+YRpBjKbgR1pLjdfZKDsOhc/6Yx/uZPch30+MMpKaYk5ZEtMrzHUXzk2Jtc34OYxS0WLy0cfRsaOed/danFtmafFJ+mme4EC1ha3kVrRGUbA6jbd6X62nB/pj2OOMCrtpK/SRnbNI4lP5xkvdOR5fuK8Ih1L9Y6PzL6XR3z+C17W29BiX/xFOdWD6+6qXbB0f6ZXDw9lsqXn8DVc6Nmbw/PFWrMS6ysnqj9msB4Im1BxeGaSFfvtyqW1a+dNjGKRTZ8bGbdseMNqLU8Q0V9D6KnPybCL30UyoAarDUk8do/P62x/9yIffeFxdsVNFnT1JHyPmD6LUlWyN4OnUgyTc1TndoUw+Vf2Xf8AtaFSsI5R8IKD2GMQ7sSbevzKb2kfugKJH4FJjl1Ey24lpqkB6qt1BpOrMmmCbj+oAK/vHR8MeUHhebIZrbT9NWTbSISp1vr1XH4GP1s9DKbt6h8PLJQ6jD8fpG2ktOzket9DZ3gmeE8pdExY+vB+OKIKRVnfo1yc63dp4nYE5w1E8APNYmKkrye2VZTBmvKGFSnzgjP+kBv/AMC+238XFzx1bEeH8IZRKGnzkS862RdiclljSNK40rGw8x1cYjwYaxtScEijyi2KlW0OGWlZ542RovsvODjA1Ea7kcIMe5aYv/udYDQjyVRDiRpifgj0Rdk5pOQ/7gTpbtzHbwZYmn8L4VoUvITVVRQ5BpGaiXlTmuLQNWakJBUBzpsecRRqLiSUedzsnuTN2eUonOqE4kIBP/mKuT1qEWLCeTSj013dTEky5iKsKJcdm5zWgEkn0UHUAOC97cFo/cT5Y8n+F1GVNUbmnkJsGJBGlzeYqHog9d4r54yM3Zff3ou1I+POKma6Zx1OYb4CxPe4juUhqUyu1bMLtXoGHZexz/NpUzLo4h6Zzf7w+o+Ga6wvPqeO6vOq4UpYl2kfglsn+8cJxJ5RlenQpvClGkmUi4U5MqU4tPEQLpF9vHHOcQ5RcqFc9GcxDPNt8nKuJYT3LX64rnlp0V3Ds/iM464ZGO4X8ifqtxKdlpOXBmJtCEJGtx5YH4k2hZM4zwhLEpdxPSEKB1jzxu4/vGB0uVMTqZ2qTEw4lN85x10rOsW4yeKJW6cjy/cV4RwMd+KnRbHsH55b9w/lbgfylYDavn4ppxttzXM78oTP5XckrpKXsS05y+o3l3DfuRjjdOR5fuK8IT7mT3Id9PjHj4dpUtmylM39bvp7KTi9qns4qqrdJmUTVPE275q8kEBbWcc02OsarRrbyKsIbk4KmMbT7QS9PBTMnnDWGkrNz2lADs88ZwyQZNqvj3HElQ22lNSmdpZ18KH0TIPpHpOwc5Eb8dalKbJSlEpzSWZOSaS0htOxISLJT1CPyY5bgUjHa4UtN0YOZUOpTzMhITVRm3M1mXaW86o8CUi5MfP/ACn1h/EGJJitTAs5OPuO5t75oJFk9QsOqNL+VVjmVo2HmcKtTITOVKzj4FyUMJPDbZnKH4JMZUqX6x0fmX0ujvn8Fr2tt6DH5Tstdyj7L0ZZC6odq7TuHufJJ4mUXfNrte6YNzJ7kO+nxj2kpV+TmUTMyjMaRfOVcG1xbg5zElalPoIh7pyPL9xXhBunI8v3FeEEVbgiZuZPch30+MEEUzDf3js/GHEJ8N/eOz8YcQRQ61vY72feEVuLJWt7Hez7witwRaM8mrHiZ2njB9UfAmpZJMipR/4jY2o6U8HN0RoCg1EyT5Q4f0dw+mP3Txx8+6dOTVOn2J6SeWxMsLDjTiTrSoG4MbJya4wlcW0VLt0t1BgBM0zfYf3h/Cf7bI2OC17aiL4WXUado9wvmG1eDPo5vj6cdUnPsPsfNUbyhsl5oM25imgMXpEwu8w02NUss8I/gJ/A6uKM51rfN3s+6I+g9KnmHJVdMqSEPSjySghwXTmkWKSP3TGY/KLyJz2GZuYxPhplyboThznmU3UuT1DbwlHPwcPGanFMMdA8uaMlf7ObRMq4xDKetw9j28ufeuEQ4w3947PxhPDjDf3js/GKRbBOIh1rex3s+8ImRDrW9jvZ94QRVuCCCCLouG8Q1jDs8JukTzss4D6SQboXzKTsI6Y7Vh7LfS1UJ12tSjrVSZTqaZF0PnmP2ee/VfZHAIIlQVksGTDkqfEsCosSsZ25jiMj3X5fYTLKnlOxTiqfelH51cnTAfQk5dRSgggfXO1Z6dXEBHPYmVrfN3s+6Ihxwe9zzvONyrCmpYaWMRwtDQOScYb+8dn4w4hPhv7x2fjDiPCkKHWt7Hez7witxZK1vY72feEVuCIi+0Olz9bq8tSqXLLmZyacDbTSNqifyHPwRVMNUKrYkrUtRqHIvT09MqzW2mxcnnPAAOEnUI3jkbyZUzJjSvP6gWp3EcyizjidjY/cRxDjVw/2jy51shqoNfXxUcZe8pjkpwPI5MMIpkkKQ/WZwBycfA2qtqA/hTew4zc8Or2xPXafhyhTtcqz4alZVouOKJ1q4gL7VE6gOEmGMy+t11cw+sXNypR1ADwjHnlOZTV4qrhw3SHjuJILupSTqmXbfW/pF7DrPCLchHnmsDTsmxysz/KNewe5+9FzbKDiiexli6fxBUCQ5Mueg3e4abGpKBzAW6dvDHhhv7x2fjCeHGG/vHZ+MdwLL6TGxsbQxosAnEQ61vY72feETIh1rex3s+8IL2q3BBBBFcIIIIIk+JPu/a+EJ4cYk+79r4QngimUXfNrte6YskVui75tdr3TFkgiISYUxBU8M1tir0l8tTDJ2fZWnhSocIMO4p8emuLCHNNiF4kjbI0seLg6hbPyY47pWN6MJmVUGZ5oATUqo+k2rjHGk8Bjo1Hq5YT5tNguy5FtespHxHNHz6w/WalQaqzU6TNuSs0ybpWg7RwgjhB4jGqslOVGnYtkmGKjoqfVlai3ezbpva6CeH+E6+mNhQYrHWM6KfJ3n/K+V45s1PhrzU0ecfLiO/mO3hx5qTlZyGStTQ5XcC6Jp5V1rkL2bc/8s/ZP8J1dGyMvY4p89S59MhUZR6UmmVKS406gpUk6toMbqp09MSTmcyv0T9ZB+qY/jGOFcE5RaemUxJTWvOUghp8HMdbJ/ccHVqOrmMQa/BiCXRqdgu2G6BFU5+f8+a+e0TKLvm12vdMdzyj+THiejl2cwlNIrkmkZwl1kNzKRxWPoq6iCeKOM7k1Si4hRI1enzUhNIvnNTDSm1D0TrsRsjPyRPjNnBb+lroKoXidfz8E3gggjmpSp8EEEEVkou9jXa94xMiHRd7Gu17xiZBEnxJ937XwhPDjEmvze38Xwiz4ByO5QsaqacpOH5hqTcAUJybGhZzeMFWtQ/pBgvD5GRi7zYKmUXfNrte6Y67kwyW4px9NpNOlTLU4Ks7PvpIaTbaB+8rmHXaO05NPJqwnhJTFVxpUBWp9KbiWSCmWSrmT9Zzi12GvWI7BMVRLcsiSpcu3IyjYzUJbSE2TxADUkdEfrWOfos3iW01PTAtjNz9/eaTYCwZhjJlSzJ0doTdUcFpmcdA0izxEj6qeJI6+OJ7763nVPPuFSjrKjwRAqU9J0yRdn6hNNS0s0M5x1xVkgRlTLflxnMTh+g4XU5J0Y3Q7Ma0uzQ4R/Cjm2nh4o9bjWd6yMEVdj0/JvE8B7n7yCc+UblnFRExhDCU1+h6256dbP/G420H93jPDsGrbxyi72tdr3jFbiyUXexrte8Y8L6RQUENDCIoh8+JPMqZCfEn3ftfCHEJ8Sfd+18IKak8TKLvm12vdMQ4mUXfNrte6YIrJBBBBFT4IIIInFN/WOk89+l0dszgte99nQImbmSPId9XjEPDf3js/GHF4Ils7KsScsuZlkZjqLZqrk2ubcPMYW7pz3L9xPhDisn9Wu9XvCK3BFM3TnuX7ifCHG5kjyHfV4xW4uF4Ioe5kjyHfV4wum5uYkZtTEo4Wm27ZoABtcX2nXtMPbxW6zvk71e6IIuqZN8uVaoeikMRoVVqeLAOCwfaHMdixzHXzxofB+L8PYskhM0OpNTFhdbROa43/AFJOsflGGIe4RmZiUfdmJV91h5BSUrbUUqG3YRFxSYzNAN1/WH18VkcW2Po64mSL8N/Zoe8ey3vI1SclLJQ7no/cXrHiIlzsxh+tMaCuUeWmU7AHmUup/uNUZawvlkxJTNGzVEN1WXSLXX6Dtv6ht6wY6LSMs2D5pgLqD8xTF6goPtFSQTxFN9XSBFp8ZRVQzyPbl/Cxc+BYzhx6rd4Di3P6ahWmt5DsmtdQpdPXNUl1dyPNJgbf6HArVzC0UypeS3MkLVT8drR+4l+nJV+JCh+UX+lYhodUQlVOrMhNhQ1aGYSo/gDDlmYeaFmnloH8KiI4SYZC7NpX7FtTiNN1Xk/P+QVwmZ8laup/w9Wo7n9a3kfkDHmz5K2JVKs5UaGgcYfeP+kR38VCdv8A4yYHQ4fGPRNQnv8Avsyf/qq8YhuwwDiprdtaq2Y+gXFKZ5KtZzs1/GsrKMj6rbEiXen0lKHDeLXRPJpwjT3Eqr2KKpOqTrzElqXQekZpV+BEdAVNzLgIXMOqHEVkx5KdQ2kqWtKANpJsI5GgaNSvEm19Y/JvoPIL+sP4MyaYXOfSsOSj0wjY861plg8y3L27MPpmvTTgzJdCJdPNrP4/KKFV8dYSpCVGexDIJUna226HF/8AKm5ig4ky9UeWCmqDTJiectYOvnRN347ayR+EcyyGNcWDGcTPUabHjoPE+67S4tS1Z7qyo8KlG5/GOXZSct+EsJpdlJF4VqqJGpmWWC2g/wAbmsDoFz0RwXKRlKxbialvsztSUxKkAebyv0aCCRqNtausmOVxHfPf8q0OG7GhpD6x1+wep9vFXPHmUvFmMp8v1SfzGEm7Uo0mzTfQDe55zcxA3MkeQ76vGK3FwvEcm628MMcDAyMWA4BQ9zJHkO+rxhbOzT8nMrlpZeY0i2amwNri/DzmH14rdZ3yd6vdEF1RunPcv3E+ETKb+sdJ579Lo7ZnBa977OgQnhxhv7x2fjBFM3MkeQ76vGPGdlWJOWXMyyMx1Fs1VybXNuHmMMrxDrJ/VrvV7wgiT7pz3L9xPhBunPcv3E+EQ4IIrJuZI8h31eMETLwQRJt6P5+m7Nrfjxwbtere0+UfmIv2Ha+EKYIm/nu6P6HotFpPtZ17W17OqDcb1n2fziHR98Wuv8jFigiU7jes+z+cG7Xq3tPlDaKlBE33a9W9p8oPMt0f0zS6LSfZzb2tq235oURYqPvc11/mYIom43rPs/nBvR/P03Ztb8eOG0KMRfsO18IIv3dr1b2nyg893R/Q9FotJ9rOva2vZ1QoiXR98Wuv8jBFNTRyk3TNEHmR84d0+rYqp6A3JYtqzCE7EImFhI6s60eMEfocW6Fc5ImSCz2g96ZM5W8aNCyazOn+p4K/MR6f74sb/wDzia/50/8ATHPII99NJ+4+KjHDaM6xN/0j2XQXcc45qiPOTi6qMJX9ht0i1tW0EcUJamqs1RV6lX5+dP8APdW5+ao8qPvc11/mYlx5L3HUrtHSwRfkYB3ABKb7kfz9N2bW/Hjg3a9W9p8o/MRfsO18IUx5XdN/Pd0f0PRaLSfazr2tr2dUG43rPs/nEOj74tdf5GLFBEp3G9Z9n84N2vVvafKG0VKCJvu16t7T5QeZbo/pml0Wk+zm3tbVtvzQoixUfe5rr/MwRRNxvWfZ/ODej+fpuza348cNoUYi/Ydr4QRfu7Xq3tPlB57uj+h6LRaT7Wde1tezqhREuj74tdf5GCKZuN6z7P5wbjes+z+cNoIIlO7Xq3tPlBCiCCJtUP1hmeafSaO+dwWva23oMRNzpzke8PGJVA/b9n4w1giSycu9KTCZiYRmNIvnKuDa4twdMMd0ZPlu6fCP5q297vV+YhBBFYd0ZPlu6fCFO505yPeHjESLVBEg3OnOR7w8YYScyzKS6ZeYXmOovnJsTa5vwdMT4QVbfB3q/IQRNt0ZPlu6fCIlQ/WGZ5p9Jo753Ba9rbegwphrQP2/Z+MEUXc6c5HvDxj1k5d6UmEzEwjMaRfOVcG1xbg6YdREq297vV+Ygi/rdGT5bunwg3Rk+W7p8Ir0EEUvc6c5HvDxg3OnOR7w8YfwQRQJOZZlJdMvMLzHUXzk2Jtc34OmPbdGT5bunwhTVt8Her8hESCJtUP1hmeafSaO+dwWva23oMRNzpzke8PGJVA/b9n4w1giSycu9KTCZiYRmNIvnKuDa4twdMMd0ZPlu6fCP5q297vV+YhBBFYd0ZPlu6fCFO505yPeHjESLVBEg3OnOR7w8YYScyzKS6ZeYXmOovnJsTa5vwdMT4QVbfB3q/IQRNt0ZPlu6fCIlQ/WGZ5p9Jo753Ba9rbegwphrQP2/Z+MEUXc6c5HvDxj1k5d6UmEzEwjMaRfOVcG1xbg6YdREq297vV+Ygi/rdGT5bunwg3Rk+W7p8Ir0EEUvc6c5HvDxgh/BBEpoP7bs/GGkEEEUWq/4B3q/MQhgggiItEEEERCGq/493q/IQQQRRYaUH9t2fjBBBE0iLVf8A71fmIIIIkMEEEEVoggggiQ1X/Hu9X5CIsEEETSg/tuz8YaQQQRRar/AIB3q/MQhgggiItEEEERCGq/493q/IQQQRRYaUH9t2fjBBBE0iLVf8A71fmIIIIkMEEEEVoggggi/9k=';
const LOGO_FULL = '';

const FAQ_ANSWERS = [
  {
    keywords: ['import', 'mt4', 'mt5', 'ctrader', 'csv', 'metatrader'],
    answer: "📥 **Import de trades**\n\nTu peux importer tes trades de 3 façons :\n• **MT4/MT5** → Fichier > Exporter en CSV > glisser-déposer dans MFJ\n• **cTrader** → Historique > Export CSV\n• **Excel/CSV** → Import direct depuis le Dashboard\n\nL'import prend moins de 30 secondes ✅",
  },
  {
    keywords: ['prix', 'tarif', 'abonnement', 'plan', 'starter', 'pro', 'elite', 'coût', 'combien'],
    answer: "💳 **Nos plans**\n\n• **Starter** — $15/mois (ou $11 annuel)\n• **Pro** — $22/mois (ou $15 annuel) ⭐\n• **Elite** — $38/mois (ou $27 annuel)\n\nTous les plans incluent **14 jours gratuits**, sans carte bancaire 🎉",
  },
  {
    keywords: ['ai', 'coach', 'intelligence', 'artificielle', 'analyse'],
    answer: "🧠 **AI Trade Coach**\n\nNotre IA analyse tes trades après chaque session et :\n• Détecte tes biais récurrents (FOMO, revenge trading…)\n• Corrèle ton état émotionnel avec ton P&L\n• Génère des recommandations personnalisées chaque semaine\n\nDisponible sur les plans **Pro** et **Elite**.",
  },
  {
    keywords: ['backtest', 'backtesting', 'stratégie', 'historique'],
    answer: "🔄 **Backtesting visuel**\n\nLe module Backtest te permet de :\n• Tester tes stratégies sur données historiques\n• Visualiser l'equity curve simulée\n• Calculer Sharpe, max drawdown, CAGR\n\nDisponible sur les plans **Pro** et **Elite**.",
  },
  {
    keywords: ['annuler', 'annulation', 'résilier', 'résiliation', 'remboursement'],
    answer: "❌ **Annulation**\n\nTu peux annuler ton abonnement à tout moment depuis **Paramètres > Gérer l'abonnement**.\n\nL'accès reste actif jusqu'à la fin de la période en cours. Aucun remboursement pour les périodes entamées.",
  },
  {
    keywords: ['sécurité', 'données', 'rgpd', 'confidentialité', 'chiffrement'],
    answer: "🔒 **Sécurité & RGPD**\n\nTes données sont :\n• Chiffrées AES-256 en transit et au repos\n• Hébergées dans l'UE (Supabase EU)\n• Jamais vendues ni partagées\n\nTu peux exporter ou supprimer ton compte à tout moment.",
  },
  {
    keywords: ['prop', 'ftmo', 'funded', 'challenge', 'pdf', 'rapport'],
    answer: "📄 **Prop Firms**\n\nMarketFlow est parfait pour les prop traders !\n• Export **rapport PDF** formaté pour les prop firms\n• Suivi des règles de drawdown en temps réel\n• Analyse des performances par session\n\nCompatible FTMO, The5%ers, E8, TopStep et plus.",
  },
  {
    keywords: ['essai', 'gratuit', 'free', 'trial', 'tester'],
    answer: "🎁 **Essai gratuit**\n\nOui ! Tous les plans incluent **14 jours d'essai gratuit**, sans carte bancaire requise.\n\nTu as accès à toutes les fonctionnalités du plan choisi pendant la période d'essai 🚀",
  },
  {
    keywords: ['bug', 'problème', 'erreur', 'marche pas', 'fonctionne pas', 'bug'],
    answer: "🐛 **Signaler un bug**\n\nPour nous aider à résoudre rapidement :\n1. Décris le problème en détail\n2. Précise les étapes pour le reproduire\n3. Indique ton navigateur et OS\n\nEnvoie tout ça à **support@marketflowjournal.com** ou utilise le formulaire 👇",
  },
  {
    keywords: ['reçu', 'recoit', 'reçoit', 'journal', 'email', 'mail', 'newsletter', 'recevoir', 'envoi', 'envoyé'],
    answer: "📬 **Problème de réception**\n\nSi tu n'as pas reçu un email de notre part :\n1. Vérifie tes **spams / courrier indésirable**\n2. Ajoute **support@marketflowjournal.com** à tes contacts\n3. Vérifie que l'adresse email de ton compte est correcte\n\nSi le problème persiste, contacte-nous directement 👇",
  },
  {
    keywords: ['compte', 'mot de passe', 'connexion', 'connecter', 'login', 'accès', 'oublié'],
    answer: "🔑 **Problème de connexion**\n\nSi tu ne peux pas te connecter :\n1. Clique sur **\"Mot de passe oublié\"** sur la page de connexion\n2. Vérifie tes spams pour l'email de réinitialisation\n3. Assure-toi d'utiliser la bonne adresse email\n\nToujours bloqué ? Écris-nous à **support@marketflowjournal.com**.",
  },
  {
    keywords: ['paiement', 'facture', 'carte', 'cb', 'billing', 'facturation', 'charge'],
    answer: "💳 **Paiement & Facturation**\n\nLes paiements sont sécurisés via **Stripe**.\n\n• Les factures sont envoyées automatiquement par email\n• Tu peux télécharger tes factures depuis **Paramètres > Abonnement**\n• Pour tout litige de paiement, contacte-nous à **support@marketflowjournal.com**",
  },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Bonjour ! Je suis l'assistant **MarketFlow**.\n\nJe peux t'aider sur :\n• 📊 Fonctionnalités & Analytics\n• 💳 Abonnements & Pricing\n• 📥 Import de trades\n• 🔒 Sécurité & RGPD\n• 📬 Problèmes de réception\n• 🔑 Connexion & Compte\n\nComment puis-je t'aider ?",
  time: new Date(),
};

const QUICK_QUESTIONS = [
  '💳 Voir les prix',
  '📥 Importer mes trades',
  '📬 Email non reçu',
  '🎁 Essai gratuit ?',
];

function formatText(text) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: '#fff', fontWeight: 700 }}>{part}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

function getBotAnswer(input) {
  const lower = input.toLowerCase();
  for (const faq of FAQ_ANSWERS) {
    if (faq.keywords.some(k => lower.includes(k))) {
      return faq.answer;
    }
  }
  return "Je n'ai pas de réponse précise à cette question 🤔\n\nMais notre équipe est là pour toi ! Envoie-nous un email à **support@marketflowjournal.com**.\n\n⏱ Réponse garantie sous **24h ouvrées**.";
}

export default function SupportWidget({ onOpenPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: text.trim(), time: new Date() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: getBotAnswer(text), time: new Date() }]);
    }, 900 + Math.random() * 500);
  };

  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`
        .mfw-btn {
          position:fixed; bottom:28px; right:28px; z-index:9000;
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#06E6FF,#00FF88);
          border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 24px rgba(6,230,255,0.5);
          transition:transform 0.2s, box-shadow 0.2s;
          animation:mfw-pulse 2.5s ease-in-out infinite;
          padding:0; overflow:hidden;
        }
        .mfw-btn:hover { transform:scale(1.1); box-shadow:0 6px 32px rgba(6,230,255,0.7); }
        @keyframes mfw-pulse {
          0%,100% { box-shadow:0 4px 24px rgba(6,230,255,0.5),0 0 0 0 rgba(6,230,255,0.3); }
          50% { box-shadow:0 4px 24px rgba(6,230,255,0.5),0 0 0 10px rgba(6,230,255,0); }
        }
        .mfw-panel {
          position:fixed; bottom:96px; right:28px; z-index:9001;
          width:360px; max-height:560px;
          display:flex; flex-direction:column;
          border-radius:20px; overflow:hidden;
          background:#070D1A;
          border:1px solid rgba(6,230,255,0.18);
          box-shadow:0 24px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(6,230,255,0.06);
          animation:mfw-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes mfw-in {
          from { opacity:0; transform:translateY(20px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .mfw-head {
          padding:14px 16px;
          background:linear-gradient(135deg,rgba(6,230,255,0.1),rgba(0,255,136,0.05));
          border-bottom:1px solid rgba(6,230,255,0.1);
          display:flex; align-items:center; gap:11px;
          flex-shrink:0; position:relative;
        }
        .mfw-head::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,#06E6FF,#00FF88,transparent);
        }
        .mfw-av {
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg,#06E6FF22,#00FF8822);
          border:1.5px solid rgba(6,230,255,0.3);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; overflow:hidden;
          box-shadow:0 0 14px rgba(6,230,255,0.25);
        }
        .mfw-dot {
          width:7px; height:7px; border-radius:50%;
          background:#00FF88; box-shadow:0 0 5px #00FF88;
          animation:mfw-blink 1.5s ease infinite;
        }
        @keyframes mfw-blink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
        .mfw-msgs {
          flex:1; overflow-y:auto;
          padding:14px; display:flex; flex-direction:column; gap:10px;
        }
        .mfw-msgs::-webkit-scrollbar{width:3px;}
        .mfw-msgs::-webkit-scrollbar-thumb{background:rgba(6,230,255,0.15);border-radius:2px;}
        .mfw-bubble {
          max-width:86%; padding:9px 13px;
          border-radius:14px; font-size:13px; line-height:1.65;
          animation:mfw-pop 0.18s ease;
        }
        @keyframes mfw-pop { from{opacity:0;transform:scale(0.92);} to{opacity:1;transform:scale(1);} }
        .mfw-bubble.bot {
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.06);
          color:#C0D8F8; align-self:flex-start;
          border-bottom-left-radius:4px;
        }
        .mfw-bubble.user {
          background:linear-gradient(135deg,rgba(6,230,255,0.16),rgba(0,255,136,0.1));
          border:1px solid rgba(6,230,255,0.18);
          color:#E4FEFF; align-self:flex-end;
          border-bottom-right-radius:4px;
        }
        .mfw-ts { font-size:10px; color:#2A4060; margin-top:2px; }
        .mfw-typing {
          display:flex; align-items:center; gap:4px;
          padding:10px 13px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.05);
          border-radius:14px; border-bottom-left-radius:4px;
          width:fit-content;
        }
        .mfw-typing span {
          width:5px; height:5px; border-radius:50%;
          background:#06E6FF;
          animation:mfw-tb 0.9s ease infinite;
        }
        .mfw-typing span:nth-child(2){animation-delay:0.15s;background:#00DDFF;}
        .mfw-typing span:nth-child(3){animation-delay:0.3s;background:#00FF88;}
        @keyframes mfw-tb{0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-5px);opacity:1;}}
        .mfw-quick {
          padding:8px 12px 6px;
          display:flex; flex-wrap:wrap; gap:5px;
          border-top:1px solid rgba(255,255,255,0.04);
          flex-shrink:0;
        }
        .mfw-qbtn {
          padding:4px 10px; border-radius:20px;
          border:1px solid rgba(6,230,255,0.18);
          background:rgba(6,230,255,0.05);
          color:#6AB8CC; font-size:11px; font-weight:600;
          cursor:pointer; transition:all 0.15s; font-family:inherit;
        }
        .mfw-qbtn:hover{background:rgba(6,230,255,0.12);border-color:rgba(6,230,255,0.35);color:#06E6FF;}
        .mfw-foot {
          padding:10px 13px;
          border-top:1px solid rgba(255,255,255,0.05);
          background:rgba(4,8,18,0.9);
          flex-shrink:0;
        }
        .mfw-row { display:flex; gap:7px; align-items:flex-end; }
        .mfw-ta {
          flex:1; padding:9px 12px;
          border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.07);
          color:#C0D8F8; font-size:13px; font-family:inherit;
          outline:none; resize:none;
          min-height:38px; max-height:90px; line-height:1.5;
          transition:border-color 0.2s;
        }
        .mfw-ta:focus{border-color:rgba(6,230,255,0.3);}
        .mfw-ta::placeholder{color:#2A4060;}
        .mfw-send {
          width:36px; height:36px; border-radius:9px;
          border:none; background:linear-gradient(135deg,#06E6FF,#00FF88);
          color:#060912; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .mfw-send:hover{transform:scale(1.08);box-shadow:0 4px 14px rgba(6,230,255,0.45);}
        .mfw-send:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
        .mfw-link {
          text-align:center; padding:7px 0 0;
          font-size:10.5px; color:#2A4060;
        }
        .mfw-link button {
          background:none; border:none; color:#06E6FF;
          font-size:10.5px; cursor:pointer; font-family:inherit;
          text-decoration:underline; padding:0;
        }
        .mfw-link button:hover{color:#00FF88;}
        .mfw-x {
          margin-left:auto; background:none; border:none;
          color:#2A4060; cursor:pointer; font-size:17px;
          line-height:1; padding:3px; transition:color 0.2s;
        }
        .mfw-x:hover{color:#7ACCDD;}
        @media(max-width:480px){
          .mfw-panel{width:calc(100vw - 32px);right:16px;bottom:78px;}
          .mfw-btn{right:16px;bottom:16px;}
        }
      `}</style>

      {/* Bouton */}
      <button className="mfw-btn" onClick={() => setOpen(o => !o)} aria-label="Support MarketFlow">
        {open ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <img
            src={LOGO_SIMPLE}
            alt="MarketFlow"
            style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'brightness(1.1)' }}
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mfw-panel">
          {/* Header */}
          <div className="mfw-head">
            <div className="mfw-av">
              <img src={LOGO_SIMPLE} alt="MFJ" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                Assistant MarketFlow
              </div>
              <div style={{ fontSize: 10.5, color: '#6AB8CC', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div className="mfw-dot" />
                En ligne · Répond instantanément
              </div>
            </div>
            <button className="mfw-x" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="mfw-msgs">
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`mfw-bubble ${msg.role}`}>{formatText(msg.text)}</div>
                <div className="mfw-ts" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {fmtTime(msg.time)}
                </div>
              </div>
            ))}
            {typing && <div className="mfw-typing"><span/><span/><span/></div>}
            <div ref={bottomRef} />
          </div>

          {/* Questions rapides */}
          {messages.length <= 2 && !typing && (
            <div className="mfw-quick">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} className="mfw-qbtn" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="mfw-foot">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
              <div className="mfw-row">
                <textarea
                  ref={inputRef}
                  className="mfw-ta"
                  placeholder="Pose ta question…"
                  value={input}
                  rows={1}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                />
                <button type="submit" className="mfw-send" disabled={!input.trim() || typing}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </form>
            <div className="mfw-link">
              Besoin d'aide humaine ?{' '}
              <button onClick={() => { setOpen(false); onOpenPage?.('support'); }}>
                Support complet →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}