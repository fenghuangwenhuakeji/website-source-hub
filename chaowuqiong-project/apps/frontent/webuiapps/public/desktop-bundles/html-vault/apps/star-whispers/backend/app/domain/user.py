from enum import Enum
from pydantic import BaseModel
from typing import Optional

class AgeGroup(str, Enum):
    CHILD = "child"       # 6-12岁
    TEEN = "teen"         # 12-18岁
    ADULT = "adult"       # 18岁+

class UserProfile(BaseModel):
    user_id: str
    age: int
    age_group: AgeGroup
    npti_type: Optional[str] = None
    zodiac_sign: Optional[str] = None

    @staticmethod
    def determine_age_group(age: int) -> AgeGroup:
        if age < 12:
            return AgeGroup.CHILD
        elif age < 18:
            return AgeGroup.TEEN
        else:
            return AgeGroup.ADULT
