import { BrowserRouter, Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  PlusCircle,
  BookOpen,
  Menu,
  X,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard';
import AnalyzePage from './components/AnalyzePage';
import HistoryPage from './components/HistoryPage';
import TagGlossary from './components/TagGlossary';
import AboutPage from './components/AboutPage';
import BulkImportPage from './components/BulkImportPage';

// Dancing banana gif embedded as base64 to avoid CDN issues
const DANCING_BANANA = 'data:image/gif;base64,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WuZm/hNvroJxDoRz3uZucOcpmOc/uOdFXudk4ecoCOgtKOhIPuRUTqh0/gOGfoKEXhaR/gCIzoKKzuRxUOmXvoKZ/uSTHhacbuSNHp6PngX/o47qpY6cpx7qMpHqWADrfb7qsMnnViDrrh4VuK4Eu04GvY4Ev57rRBHsRkDsYGDsQE7rvGnrwo4UyD4Ez/7lyl6dzJ4E0d7srz7t7lntwK7t+MntYnDtQCDu2L4S5O4D5x7r3i6g4F7s686g7V7uNJHuPEDvt/7uFhrvyc7lldrq8i4S9q4DAW/t+A6ig67u/F7l+v7vLGGof34IkePvZhDxC98FjdOJDO/sDi/pEA85El8GFH/wbnDxkJjxZ77xlt7xj/PxZBDyi/4GJC+IJj/sKI8ILq/phnDzoA4HMT+HM2/nNa/yjsPyY6DzUh4HPU/0P/8QKJ/yOe/xFT8H/0av5UjPOBi/9DrR9DYP9SI/CFMf5lW/OFeP9fMe9E+/8lEvB1+f5mGvOGNP9tm+8VuP9l0vCGsP522fOG8P9w1v9oVw93gu9Em/8zBv9SXP93Hv8HM/9Gmf94Zf9y3/+D6P+C2h9YIv+Tj/91z/8iOP+Y1P+Uzv94QA+A9/9owP+UXv+agP+hth+aY/+Ef/+qpP9Tw/+5nP+iPh+ppP95zv9Zt/+xNv+4SP+wAv+r7P+8Bv978//MEv9odP/NAf/dI//dRf/dZ//dif/dq//dzf/d7//eAf/uI//uRf/uZ//uif/uq//uzf/u7//vAf//I///Rf//Z///if//q////83//+//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+mgCn///9lgCn///9lgCn///9lgCn///9lgCn///9lgCn///9lgCn///9lgCnNjin//wWY0uyY8v9fgCnNjin//wWY0uyY8v9fgCnNjin//wWY0uyY8v9fgCnNjin//wWY0uyY8v9fgCnNjin/fxqsMiHkjyn/fxqsMiHkjyn/fxqsMiHkjyn/fxqsMiHkjyn/fxqsMiHkjyn/fxqsMiHkjym9/38arDIh5I8p/38arDIh////i5Av////hpAv////hpAv////hpAv////hpAv////hpAv////hpAv////hpAv////oIAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////ZYAp////////////////////////////////////+xECACH5BAUKAAIALAAAJAC4AwgCAAX/ICCOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2Kx2y+16v+CweEwum8/otHrNbrvf8Lh8Tq/b7/j89MDv+/8HMICDfXqGh4iJiouMjVqEhIKQgI6VlpeYmZqbdJOUL55/nKOkpaanqKk0oX6SrIGqsbKztLW2ba98rqy3vb6/wMHCPbmwLsXDycrLzM2qyKC5ztPU1dbXb9DH0tjd3t/g4UraLeTi5+jp6usj5ivu7PHy8/S98Cn39fr7/P2L+ScA+htIsKDBMgJLJDzIsKHDh+O4bXsFsaLFixiJSSy3MaPHjyBDLmzXMaTJkyjR/40UsjKly5cwObUEMjOmzZs489T0sTOnz59Az/TkMTSo0aNIqxTVsTSp06dQhzTFMTWq1atYY1S1sTWr169fu64qCbas2bMoxM5Qi7at25dstZJ9S7du0ri7Qtndy/co3mgU+woeHPPvRF6EEy8zTJgxC8eKIx+C3JcyvrmSM8uyvJdzQMyaQ5/yLLq06Y+kT6te3TA169ew97mOTbt2utm2c+u+hnu379/JegMfTryW8OLIk5c6rry580rMn0ufric69evY4VjPzr27me3ew4sfT768+fPo06tfz769pt7g3ctfDR/0/Pvq6wfGz9+9fsT9BZiffUXEJ+CBfP2nF/+CDI6noCcNRujdg5NIaCF2FEJy4YbSZRgJhyAm5+EgIZZI3IifmKiibiiKsuKLtbXYCow0viZjITXmeNqNuujo424tGfjjkFcFSSCRSNpm5H5JNvnbkgA6KWVuUC445ZW0VQkhllzaeCRJTHYppmhaVjjmmaGVqSGabEam5odtxinYmyTKaWdnX4og5J18+kNnin0GWtafLgpqqFeEznjoolYliiOjkEYq6aSUVmrppZhmqulbFnTq6aeghirqqKSWauqpqIK6SKqsturqq62uCuustNZqa6gwGKDrrrz26uuvwAYr7LDEFmvsscgmq+yyzDbr7LIH3SrttLTKSu3/tdiWam223HYb6wvPhivuuOSWa+656JobrbfsXrttu/BWq0i89Maba7r45qvvvvz2O+669QbM6rsCFzwqwQYnDOu9/jbs8MMQR9wswApX3CnCFheMccYciyrAxyCHLPLIJJds8skop6zyyiy37PLLMMcs88w012zzzTjnrLPJLHRc8cY+wwt00B3vbPTRSCet9NJMN+3001C/3DPRGs9LtcBDX11x1Fx37fXXYIct9tg7T601vVmfTW3aagtM9ttwxy333HTXXbLZbbPLdt617s03vHYHLvjghBdu+Ml4/52t34q7ynjj3B4u+eSUV2450olDPu3jmp/KeefTXi76/+iklz565qD3bXXq0n7Oeq2mxy777LSLjfrrr7qOu6e67+5q7cAHL/zwNd/ue6q975788agS7/zz0ENvPPOmLv+69dSTGv323Hd/+grZ5756+MiPT/613qev/vp1n+/++/DHL7+oyGZg//3456///vz37///AAygAAdIwAIa8IAITKACD4isa8zvgRCMoAQVV78FWvCCGMygBjfIwQ5qsIHWmKAIR0jCEtKrgh5MoQpXyMIWuvCCIKyGCWdIwxraEFUofKEOd8jDHvoQgTGkxg2HSMQijjCHP0yiEpfIxBSyj25GjKIUp5g9JDbxiljMohb398S5UfGLYAzj36y4xf8ymvGMOuyi3MTIxja6sWJkRKMc50jHBaoxbm/Mox73mK041vGPgAyk/u4INz4a8pCITJUfBcnIRqKRkG9LpCQnKclFOvKSmGQiJMlGyU568o2WzKQoR/nCTY7tk6hM5RRDScpWunKDphSbKmdJyxqy8pW4zOUBYxm2WvrylxK8pS6HScz+8RJswEymMt0nzGI605nH/Noyp0nNszWThRrIpja3yc1uevOb4AynOMdJznKa85zoTKc6y7nEINaimvCMZ8auucJ12vOe+MynPvfJz3O281i+kKdAB1oveqqwnwhNqEIXylB7/tNYASWoRCeKLYOmsKEYzahGN5rPhxb/K6IUDalIYWVRDXL0pChNqUq1ucRo6mykMI3pqUqawZXa9KY43WdLXYozmfr0p56iKQZzStSiGjWcO+WpzYDK1JgK9YJHjapUiZpUpdKsqVgN6VMtONWuevWkVbWqzLJKVoJudYFfTataFRpWscKsrHCN51kVuNa62vWebXWry+LK12nONYF3DaxgyZlXvbKsr4gF5l8RONjGOnabhTWsyhJLWVou9oCPzexgIytZlFX2s6i8rAE1S1q7crazJgOtaikp2gKW9rVpPS1qSXaqC9j2trjNrW53y9ve+va3wA1ubkso3OIa97jINS5xk8vc5jo3uK3FH2zPOYHqWve6/9idwEKzy13rTpelHZztXk313PKat7zLPa961xvc9LL3vfC9bXTv991ydre7271vduurAQ+Kt2W1ja+A3+veARv4uQU+sIKRO1/78Xec+t2vQiOMXf76978rC/CCN3zcBHP4w731MIhHjNsGZ+DB4qTwdfOrYu3W98IYTpmGSUxj3Iq4xiC+MY453FoU27fFLk4okIM8XRjH+GQz3jGJdaxkBTO5yQbusY8hDGQWq9jC4T2yZ8kL5SWTsMteHiGYRyzlKYdzyFamMJY5qOUtl2rMOf4ynDn85Dmvt8xm/iaaJ1zlF2e5zSVLsp0HXOdBm7fQhn4unvPczT0Luc/fNf8yoEUm6EQTWM6WFjCiM53cRTN6m45GaKhhK+lJg6zSnD7vplOtXEyz+s7H8uCn9QxpUdea1H82dchQ/WrnrrrXwP01sH3r6VlrYNT8RHZpS61rXg8bucJ+9m6jLe3cFnvWytZntjXLbFM7u9rCpTa4bSvucV/709vGZ7of2+1Jf3vcvy03uOVd7XMzet32xHdj2w3od8M7xK7+d6vFLHAGx7qDxm70rZO98GXnWtcfK7jEJ07xilu8txZdqb4TzvFxEhDiIru4yEdO8pJnOuMq3XjHV+7Nj4McZCaPucxnTnMFozylKme5zrPp8pcLoOZAD7rQhw7cm6M05ztnec//X070pjv96TFvZk6RnvSOLx3kUM+61rdu7oMLcOoNr7rYeT5An0ec62hPu9rtLHWcUn3ss746xNdO97rbHcRtv+nb4c5ouev67oAPvODPm3eb7p3vZva7qQfP+MY7ntheDyDYW4x4xCt+0o/PvOYZX3iNh73ySi+72TdP+tKvvfMp/zzorS56n5v+9bB/OupxrvrVJ/zygI697ndP89kfvfa2j3vrmc774hvf4r4/6eGDH+nhY/340I9+141FwMlfmfk7x32bpc/97r86+d5cPvbFmS7qAn+d2mdaurjg/fa7n+2RB6D5KT9+hZbfnOIHZ/qXtv4tvP//ALhj4Kdw//RXfwh1fz9WgAi1f0rTf1oQgBAYgRs2gNyUfwbYTQhIThbYcs7HNQ6YBRIYgiL4XhQIaud3geeUgVSmgP3EgBg2gjAYg81Vgtq0gSiYTSqYYieYTi74XzL4g0BYdPH3P/N3fTeoTzl4ZjuITj0oXkH4hFAoX0PoP0WoZkeIhOhShRG2UE04W1H4hUBIg9lkgzeYhOBEhpDVgX8Hhmw4gmJ4bEt4heBkhrTGgvzUhajVhnoogW+IhhdIh+EXh+aEh521h4YIgH0oiHKIgVmIf4pIWGq4eIc4id6XiHa4iOgEiARohAsYiZhHiaAYfZbIiZiYTppYgY/ocZ6Ye6HYiv/FN4pWWIrqdIomeIn6RIiS5Yq6qHuwuIWyOIuNmICkeIeruH2/hQHImIzKuIzM2IzO+IzQGI3SOI3LGHTUeI3YmI3aiI3WuI3e+I3gOI1v+IvAaCwBcI7omI7quI7smI7IklO4iDLI0o70WI/q6E5HAFzhuI/8uI/d2I8AGZDT+I8CWZAGmYzjSI6ZeCz22JD0+I44FY8nM48OWZHuCFBLoI8HuZEFSZAc+ZHh6JEgOZLamJAKaU4UaZEWCZE3JZEmk5Iq6ZD4aAQaSZI2mY0ieZM6+Yw5uZM+qYwmeZLkBJMxaY8saVMuWTJEWZQPiZFKUJM/GZXK2JNSuZNUWZX/NxmUQilOhQOPxahlUImVP3mVYjmSZFmWH6mVWwlOXRmRX3lkYYmWN3mWcnmQdFmXBamWa+lNbdmSbxljcYmXIHmXggmQhFmY/KiXe8lNfYmUf/mCx4iYJHmYkgmOlFmZ3qiYi6lNjblSSWlVgYmZAnmZoomTQFeaHKmZm6kBnalSn6lUoYma/EiasjmQp1mbeTmF/bOa+tSaKfWaPBWbuPmNtDmcPHmbxtmPqrmZvolSwOlSwpmcpllz0tmPxVmdQKmb/MOb+dScYPWYPhiZ2GmZyDme3nid5rmci+mdHPWc0RSd5hmN6Dme84md6rmX7LlR7nlM8Bmfx0md/rmN//VZnfe5lvmpUfvJSwG6oAzaoA76oNdYoFsZNip5lC04QOmiktsDoRzaoR76ocMpoUJJoSt5LFyIoeiiodEDoizaoi76ojspoidJohVpocQoQBlqkRsKozzaoz76o9goowpJozJpomyFoueiotADpEzapE7Ko0JKjrNzogJkdgLwpFiapVq6oFH6i1N6pFVqdls6pmRapqXZpbL4pQmVoLFkpm76pnAqlWhaimraiWHqc3Gap3q6p7lJfQPEnfhUpxd6py/Hp4Z6qIhKjXOKiYJ6owFkpYkaqZIaqYu6iI2qU+ApXpO6qZwap5Uqh5d6i5k6W51aqqaqpZ96haHaUf+jilqn+qqw6qOpeoSrik9sakqxmqu6+qGzeoO1ilet2lm7OqzEyqXauT+Aek+/6lDBKlnF+qzQmpy9elR+mE6FU6ESoyxKCknR2q3eipnTalTVik7XWqLZupT12Kbfuq7sWpbhWlTjek7lWqPniq70qK7tmq/6mpXHqj86F6/mNK9FWq/mqKO4uq8Im7AH+a5EBbDlZKVHprASO7H7yLDWF4s2BbExRrEc27ER2q/586+pyE8ai2Eee7Ioy4wW63Yju08l+18pG7Mou7J617K9+bKkKrM6S7E0a3g2250466o7O7QJ27OeZ4snFbRCS7RM265Gm3pIy1FKK6xNW7X/3/q0tBe1GzW1zmq1XgutWPt7WqtRXGtYX3u2xBq2yvezgVq2boW2cJurastRDktObvu20egAeru3fNu3fvu3gBu4gju4hFu4feujhpu4iru4jKu4svoAkBu5kju5lFu5lnu5kNu4mhu4DFu3ajU7TBm6opuOmpq3m3u6qJu6h9ujqtu6rsu4j4u5sju7tPu6mtu5bPtYoDu6vFuUpQuNthu8wuu3iDu8xhu8sUu7yru8kXu8hou7Yztlu9u71OuQv/uMzpu9qlu82tu9jZu8zBu+suu9nAuy0sWy0etj01u97NuO1+uM5Bu/icu98lu/gAu+4nu5s1N96DuMxna3/2IljfY7wH9LvwRMwPibv5W7v3/avxjLcQBsVQJ8wBRswBRcvwmswJPLwF/nwL64chGsVBN8wQNswSRMvhmswZHLwZLnwfqlcyHMUyN8wvJrwjSsvSmswg/AwvLnwvcFwzEcTTN8w95rw0R8vDmswjxMhD6MXywXxEJsukdcxKw7xVQMpTpsuUtMhU3MXUAMxfiKvVbcvUY8xrabxBq8xbvZxRIGwmAcxvBrxtlbxnLcumiswGq8nWxcYU/8xgcLvHWMxFUcyMN7x/mbx8i6xyvWx37MrVJMyMg7yJB8xj2axVosO/xbs+mLYo28SUM8yXYsyaAcylhsyRuMyQ2syf/+O2ud3Mqu/MpxY8qyPCyZHHw5Z6/tm8u6vMu83Mu9jCywHMwvN8vE/Cu1bHu3zJC+vMzM3MzO/MwXaSzCPM2mVszWvCvHvHrJXLDQ3M3e/M3g3JDATM3kfGTXnC7ZDHrbXCzh3M7u/M7OPM7lPM/0nDLpXHk5V8/6vM/8XDv3jHj53M8CPdAEbTj/zHcBXdAKvdAMHTYHDXcJ3dASPdEUbTQPPXYRXdEavdEcvTIXLXYZ3dEiPdId/dFVF9IkndIqvdAmnXQovdIwHdP13NI799IyfdM4/co0LbKbzJo5/dNA3co7zXI2HdRGfdRKO9QrV9RI3dRObTPMC8/mai7/NO25r1U4CJDVWr3VXI0AuCzVotvVYq3V8vzUZp00UQ3W4owuVZ27ZobVYy3WX63WRRnXcn0sZ53XSJPWdN2U59LWPf3FgmPXXT3XfW2RhM3VZa3XjA3Vy3vYfk3VqayBbi29hJPYW23YkN2QmE3WeE06oxzaoj3apO28zDs76DzZK7jKiNfYglPasB3bsj3bgnvaspPaHSyMD7x6rh04tP3bwB3coGzbsYPbLazbHxx8vW03wt3czv3cJEzcpmPcPYzcL4x9y1030L3d3N3dxyvdpUPdTGzdP4zd2T033p3e6r3ejAvepCPeXEzeTsx8543e7H3f+J3fDuDeowPf/2ss315s3vUNN/pd4Aa+3fwtOv6txwDexso94AR+4BI+4bOd4Jez4Inc4HxM3xD+NhT+4SAe2hZuORjur44Y2Izc4WIT4ize4mY84pVT4iF74qzNdypONi6e4zoe3cuL2myt2jqI4m5842FDuBxw5Eie5Eq+5Eze5E7+5FAe5VKu5Pk95VZ+5Vie5Ve+4+dszUej1F5KOIttN5qNjmM+PEau5Wq+5mwu5VXe5nAe523O5V1OzF8O5IBaOGdON2V+jnsePGku54I+6G6O34R+6Ii+5HRe57J857mdrNmk5589OH0eAH8OPIGe6Jo+6G++6Z4e54vO6Jbs6McN6T5N6f+TLjiVfum1k+mf/upa3umwPutbruOi3ugWjefcSeQrPri0/utWLuvAPuxMHuq3rsS5/uiQzutF7uvE/uyKbujQPu1HbuzHjsfJXurLzuxf4+rUPuzC/u3Abu3XLr6kXt2mzu3d7uziTuzh3u6zTu7lDuMyA+Zpqu5d4+3wDuvvvu+fLu/zrrznPt7pju9co+/+7un9nvCaDvABP7sDH98Fb/BQg/AMn+gLf/GH7vAPj7kR/98TT/FOY/EaT+gZX/KCzvEdf8k7Y+90KvJPQ/IoL+cnP/NwrvIrT7kfz+AhD/NLI/M2P+fSHvSIjvM5L7k7n+E97/NJA/REr+Y1//T/sW7rR9/j2Y7u2870SyP1XN/1Xv/1YP/tR+/yX2XV4XQ0C7XZap/LC9U1Yf/2cB/3cj/3Uj72uq5ZZs+WRpP2a9/3vdv2XEP3gj/4hF/4KG/3yv5aef9NaK9Qfv/4ogv4UWP4lF/5ln/5no742q74la1OjZ9QkB/6MSn5UIP5pn/6qJ/6T675WM/5Qo5Qn49Qoj/7Dkn6T6P6uJ/7ul/4rE/wsLX4fLn3jk/7xN+Otu80u5/8yr/8Ut/7Ev/7nW+twg/6xV/96Xj8TcP82r/93C/uzg/y0P/6/RT7/WT95h8A2M803b/+7N/+m/79PB/+Nb610y/751/96b/17r////wPApw4kqV5oqm6sq37po8807V944a+83r2A4PCjKZoPCKTyiWz6XwWJ9IptTqBYrNJAbfr/YLDXq02YD6j0+o1u+1+w+PyOZ1Nzorz+j0Y5v8DBgoOEhYaHiImKi4yNjoC5kRKTvYYDF0C3WluckZZfUp1ihrxlYaNLtWprrK2ur6ioSqZ0tI+3uLm6u7y9vr+AjNSDhNXYmLKJieDgipv1tY6G8FSV1tfy0kXQXPnBX+Dh4uPk5ebQxanV65bHg9pw5Mxf8bjdfPBY+vv87vC3wPscm4gwYIGDyJMqG4hux3u3tWL2GSeFYlPAurJ128jx45p/mG8l3AkyZImT/+iZMFw5bqHQizCREKxSkwmIcVo9Khz5zWQN6GlDCp0KNGiuVgidegyU82YM6k0nfXzS06eVq+q8jnVlNGuXr+CDeuoYculZoNoeTolKlsnW8doo0O2Er+5Pera3UFH69s9Yv8CDiwYcF6lZ8+mVXulLeMtfQVUhVNYB97ClfPu1fa41ODOnj+DLji53WGzidU2Tk3qceQ3oy/bhT03s7TNfELjzq17d6PRpRFnUbxYdePNrd283pdc3/I4fG334S19OvXqJnz/Xnr6KfHUxjVDDy9+PGTw5L1YT69+fWfs2R9un9m9OGvz5+/jB/icPPv+/v8L5d57x8RH0XyMfVf/W34LMmjKfuMBGKGEE54j4ICXFDjPgW0l6EyDH4IIxoPiUViiiSfqYuGFLwWn2IZsdahMiDOCOGJ4KOKYo46DqLgiU1gI92JUMSZDo5EL2gjdjksy2eR1k/mITIuoCVkTkbIcmeV5SdrmpJdf4thjlBkyU6WV9SmopZq2cbkZmG/CCaCYPpLZjJkwXYnKmnui6eGCcQIaaHVzrlgnPXdalOcofDI6VZuPCRqppKEReqGhFSEqkaKiNNopRo/2Namoo/5V6YCX0pRpRJt24qmr3YD6Fgsb0Fqrrbfimquuu/Laq6+/3iodsMMSW6yxxFJ4rLLLKmtqlPCpWk+QWTR3/81mo2GbrbZkbSbXZACAG66445Jbrrnmzsqsuuuyu4Gw7cIbL7DJyltvs1A+e2q08UyLRbXWXLutwAOP1u0co52bsMILg5uuvQ/b+y7EE8NLL8UX5+psvlLuq02/UPxbTcAEk1xyJQbLgTDDK7MMgMMYw2ysxDHTPO+ENces8cYQdSzNx0+ETM3IJhNNMspxqNyy0ue+jLPTuc78tNS1Wjy1vTrvjFbPPrtoz6tfgx02eitYXba7vJltddVpt4t11j9szTWVWIhdt92dNs02zVHrHfPafTPr9ttxO/OzW3cjnriReQN+Md+NU/w35MYKnjXhyhjehOKbc/4n2ZPD/P846BHfPPq9hb1d2uXLdE1356/D3uXnpk8sOu0Vl347sZXvvLosmdsUu/DDh8S47u3afry6kiuvK+8b+44K8EsQX731tRjfPLPJa38s893b+ny+0Y8yvVTXo5/+F9mDLzPa7bP7PfziP0u+KOY7pr7+6LMP/7Dc++9X8msf/cZkP07gDwn7W6D1+hdAXwHwgbwaIPgKSKcDbiKBR2AgB4XnQAnuKoIghFruRmjBQmFQExpcTQdbuLkRwjCGMpzhDJNCstThMIc63OEQgoYVbFAgiBTAgRAp8ENWJG1pSlwiDZvoxCdCEXI2JBgPq2jFK17Ih0esRhGJKMQtqiKJSxz/I8uiaMYzojGNV5uiwLDoxjfCsYeTAWM/uniDItLRW4UhIx/LqMY/AjKQgrwVG9sYx0MikodazGMr7GgDPDISad/qIyUTNshLYjKTNCzkthLpyU/urIWOrEERXbggTaIylapsHie1BcpXwvI9ohSiF4NoyvysMpe63GXaWpmtWAIzmA+ZZRBrSYFb4oeXylwmMyfmS2wJM5rS/AExh3hHISLzPs3cJje7Sbln4mua4oRlNStgznOeE5vZJI832+nOd9IKnOEcJz0TWU50plOd6xQPPPvpT2XKE3X1HOgh74lPc+pzn9D5J0MbqsmA5oWgEn2jQQ+aUIVuxqEa3aga/yFql4mC1IrlLCJJbYnRhXI0pSrdpEfJEtKX6nCkJS3lSW2z0pvi9IEtdSlMe5o1mc7UpDV9TE6LalTl7bQhPl1qvoAa1KFm9KhSnWrOklq0q2I1q1rdKle76tWvgtUulRwrH6lq1rOu0aphXStb2+rWt8I1rlslK12ViNa74jVwapUrX/vq178CNrAEqyth/ZjXwyK2V3sVLGMb69jHQparhZ2swhJr2cuGb7GR3SxnO+vZzVI2tOXCLGkTq9nPoja1ql2tV0Xr2nCVNrZ4PS1ra2vb2+KWLK99rWx7a1ba5ja4wh1uZ3frWt8i96jAXS5xm+tc4hpXtMmdLk6Za//d52I3u6iNbmip692UXje82h0veQPLXcp+N70OFS97y+ve9671vJNVL3392d77wje/+iWafAtb3/+6E78C3i+BC7zH/tYVwArm5oAbbOAHQ9gACE7wgisMUAdjOMIadu+E6eqrDndYkCCeMDMLWww6FqPDi2yFGEd8rhUjcZIIhvEqWuxiu/bqxvIVsY65W2LCnhiMKZ4wjcMo4x6Xq8h1sHF0lazHvCB5jB+O8m55TOXjLtPExEAxMVQ8R+Uc+crgcvLBwnxeMqfMzGKubI7X3N1AuvnNytTyMLg8DC9bBswHjjOaJbnn/vZZMmqO82jbTGjCWvnQHs4ykLcs5C7/E/nLzBl0lAPtGkrv1tLIwbSiATDlTpM10aCm5I/rGuQtDnnGksYGkyu96mu0OtOvtkasO/3pUZMazriuZKnpeuojphrQs65GrXWs6TYUW7THZkOyCX3rXZNR1NBmIqNN7WhUQ1rVeZ70n9e87DU0m7LfVkO43fzsaeMYkOgua7V9fW1gZ1vY22Y1p409bGqUm86Y0TOU1+1pQ/t7adIO+Mp6TdZf/zDY8h13GvId6XnDut7KvjcsHH7lcxOcYQPPOJvn3Og6P/rOD983t/vNZ4q/wuLuhjitJe5sgHNc47qOecHbffB3JzzeC0e5K1S+c5YT2+Xi5jmLhW5umNPc/5IzT3rHeanvSdiZEngmOb27LWaGo8HnY8X6GbTeY4wznVwbD7u4DL51nGNF4WcmeoytfmWum8HrlIR7AOR+Y7CTHbZLz7vYbX52kGNb5NqmesTdTmW6252PiDf6mvHO97E/3u+VRHjadb52oOOb8SOPDb/FuvnZdH4ufB896Utven9TPuiGnzZfY976z0dCNro9Pe1rb/vbgzj1mV89tF+fcd/LmxKybwjui2/84yN/7mhXvckJDvyAP//ywg/97JNv/etj//q6r7jmTx5X18t16lCnPvGzb/7zo5/02095990c/XW/v8nL333z02//++N/1+vvefu9HX6Ox59x7f9f0fFe/hngASKg+EnC8LED+H0fAP7f4I1fyXleAlrgBWKgAM4f9xUgrgVg70Vg8E1g1dVfBprgCaLgGA1g25Ug/IUg9L2g9I1g4bVgCtrgDeJguKxgjfXf1cWgCz6gBC4g+TVgDhrhEabgDhpZB47aB+rfD8of4JFgBSJhFVqhASrhkvXg20Eh63WhrEkhDVLhFZJhGWJfFj7ZGKLeFz5hEIrgEFKg6JnhHNKh8aFhmTEhqDmhB7Kha91hmuVhHQriIDrfBrJfICraHjZhH05cGLYcIhJiJEpip/2hn9WgF7ohDGaiDMLhFMrhJIJiKILgaYliKU4WcJliKqoiF5L/4iq6Ihmh4ivK4ixyVyzS4i0qjC3i4i7yovK1Yi8CIwDoYjASYzG+GG0ZIy8OYzIyYzEuYzOu4jNC4zTeojRSoyha4zVqYypm4zZGYjd6Yzh+IzKKYymCYzmioxmeYzqS4Tqy4zsaoTvC4xHK4zzaownW4z3aYD7qYz9iITn6ozoCZEAS5AnyY0Fa4EEi5EIin0IyZP455ENKJO1F5ESiX0VaZEZq5EZyZEd65EeCZEiK5EiSZEma5EmiZEqq5EqyZEu65EvCZEzK5EzSZE3a5E3iZE7q5E7yZE/65E8CZVAK5VASZVEa5VEiZVIq5VIyZVM65VNCZVRK5VRSZVVa/+VVYmVWamUxHkBXeuVXguUBtExYkqVXbuVZoiXZlWVZjuVahmVawmVcBpxbviXL0CVYymVe6iWo3eVXtmVfiuVeCuZgUhlgduVf9iVhKuZigphhBubKOCZjSuZkGldk2qVhUmZmaiZhWSZkYuZmll5ngqZGiubClOZoht1pouZDqua5tOZqctxrwiZByia51OZsrttt4uY96ma49OZu4tpvAic7CqdwDqeiGedximNxfqZyElxyOuc2MidgRudzNmd16uN0JiZ25uZ1cmczQiddhed3utZ4kqcqmmclped5FtZ6smcouicfxed7jtV80ich2ucS5ed9ktF+8ucc+v+n0gTofwqodxIoLg7oZVLngSJYgjLoEToow0Tog7qmgVLoK06owmQoe2rnXV6oJG5ohS7oh/ZRh9IlieKnhUZXiJKnibolig4ii5aLjHKni64ljAoijY6LjlanjbIljtIhj/qmigKphBLpjB5pkeagkIILkyqnj5KlkpqhkzrpcUJpXUrpFVJpkmapbXKpuFRpl4ppOF4pXo7pmbZkmfolmrJpSqqpWbZpnJbkmx6mnNppSNLpY97pnm5knvLpn5Lmlw7piAJqoY5kmBpqonojoipqo04jozpqpBojpEpqpfYipVpqptIipmpqp64ip3pqqIoiqIpqqUYiqZpqnG3qKaF6Kqqm6pqt6naKqqu+6pXFqoeWKq3WapTd6onmqqDuavL16ov+KqsGa/oN640Wq6weq/0l64/OKrA2a/E9a5RO67UmYLViKbZy6/1pq5l2a7ii37euqbiaK/aRK5ye67oiX7rWKbvCK+65q57Ga72a3rzaa77eq7S2J7/q67/mnZ8C7MDmn8AS7MGOq7TqKsIybH8ZbMNC7PE9bMRSrO1NbMVibGgqrL9mbMei28V6bMjSHMiKbMnO5cYaq8mq7MeiLLOu7MtCG8nC7MwSmszS7M3aasviKs7yrJvZbM8CbWPqrK/uWggAADs=';

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/browse', label: 'Browse Games', icon: Library },
    { path: '/add', label: 'Add New Game', icon: PlusCircle },
    { path: '/glossary', label: 'Tag Glossary', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-dark-800 border-r border-dark-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-xbox-green rounded-xl">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">GameTagger</h1>
                  <p className="text-xs text-dark-200">VGMS Classification</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-dark-200 hover:text-white lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    nav-link
                    ${isActive ? 'nav-link-active' : ''}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-700">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-xbox-green rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">System Online</span>
              </div>
              <p className="text-xs text-dark-200">
                Video Game Metadata System
              </p>
              <a
                href="https://genometagger.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-xbox-green hover:text-xbox-green-light mt-2 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Production Site</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function useDancingBanana() {
  const bananaRef = useRef<HTMLDivElement | null>(null);

  const dance = useCallback(() => {
    if (bananaRef.current) {
      bananaRef.current.remove();
    }

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;

    const banana = document.createElement('img');
    banana.src = DANCING_BANANA;
    banana.style.cssText = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 150px;
      left: -200px;
      animation: bananaSlide 3s ease-in-out forwards;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bananaSlide {
        0% { left: -200px; }
        50% { left: calc(50% - 75px); }
        100% { left: calc(100% + 200px); }
      }
    `;

    document.head.appendChild(style);
    container.appendChild(banana);
    document.body.appendChild(container);
    bananaRef.current = container;

    setTimeout(() => {
      container.remove();
      style.remove();
      bananaRef.current = null;
    }, 3500);
  }, []);

  return dance;
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const danceBanana = useDancingBanana();
  const [partyMode, setPartyMode] = useState(false);

  const handlePartyMode = () => {
    setPartyMode(true);
    danceBanana();
    setTimeout(() => setPartyMode(false), 3500);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/browse': return 'Browse Games';
      case '/add': return 'Add New Game';
      case '/glossary': return 'Tag Glossary';
      case '/about': return 'About GameTagger';
      case '/bulk-import': return 'Bulk Genre Classifier';
      default: return 'GameTagger';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/': return 'Overview of game classification analytics';
      case '/browse': return 'Search and explore tagged games';
      case '/add': return 'Submit a new game for classification';
      case '/glossary': return 'Reference for all classification tags';
      case '/about': return 'AI-powered game classification technology';
      case '/bulk-import': return 'Classify games by primary genre only (admin)';
      default: return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-dark-200 hover:text-white hover:bg-dark-700 rounded-lg transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{getPageTitle()}</h2>
            <p className="text-sm text-dark-300 hidden sm:block">{getPageDescription()}</p>
          </div>
        </div>

        <button
          onClick={handlePartyMode}
          disabled={partyMode}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white
            bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500
            hover:from-purple-400 hover:via-pink-400 hover:to-fuchsia-400
            hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30
            active:scale-95
            transition-all duration-200 ease-out
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
            ${partyMode ? 'animate-bounce' : ''}
          `}
        >
          <PartyPopper className="h-4 w-4" />
          <span className="hidden sm:inline">Party Mode</span>
        </button>
      </div>
    </header>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/browse" element={<HistoryPage />} />
              <Route path="/add" element={<AnalyzePage />} />
              <Route path="/glossary" element={<TagGlossary />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Hidden admin route - not in navigation */}
              <Route path="/bulk-import" element={<BulkImportPage />} />
              {/* Legacy routes redirect */}
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-dark-300">
            <span>GameTagger VGMS - Video Game Metadata System</span>
            <Link to="/about" className="text-xbox-green hover:text-xbox-green-light transition-colors">
              About
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
